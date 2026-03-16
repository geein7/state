import json
import math
from http.server import BaseHTTPRequestHandler


def holt_winters(prices, season_len=5, alpha=0.3, beta=0.1, gamma=0.15):
    """Triple exponential smoothing - handles trend + weekly seasonality."""
    n = len(prices)
    if n < season_len * 2:
        s = prices[0]
        t = prices[1] - prices[0] if n > 1 else 0
        for i in range(1, n):
            s_prev, t_prev = s, t
            s = alpha * prices[i] + (1 - alpha) * (s_prev + t_prev)
            t = beta * (s - s_prev) + (1 - beta) * t_prev
        return s + t

    seasons = []
    num_complete = n // season_len
    overall_avg = sum(prices[:season_len * num_complete]) / (season_len * num_complete)
    for i in range(season_len):
        vals = [prices[i + j * season_len] for j in range(num_complete)]
        seasons.append(sum(vals) / len(vals) - overall_avg)

    level = sum(prices[:season_len]) / season_len
    trend = (sum(prices[season_len:2 * season_len]) / season_len - level) / season_len

    for i in range(1, n):
        si = i % season_len
        l_prev, t_prev = level, trend
        level = alpha * (prices[i] - seasons[si]) + (1 - alpha) * (l_prev + t_prev)
        trend = beta * (level - l_prev) + (1 - beta) * t_prev
        seasons[si] = gamma * (prices[i] - level) + (1 - gamma) * seasons[si]

    return level + trend + seasons[n % season_len]


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length))
            prices = [float(x) for x in body.get('prices', []) if x is not None]

            if len(prices) < 5:
                self._send(400, {'error': '데이터 부족 (최소 5개 필요)'})
                return

            pred = holt_winters(prices)

            n = min(20, len(prices))
            recent = prices[-n:]
            returns = [(recent[i] - recent[i-1]) / recent[i-1] for i in range(1, len(recent))]
            mean_r = sum(returns) / len(returns)
            std_r = math.sqrt(sum((r - mean_r) ** 2 for r in returns) / len(returns)) if len(returns) > 1 else 0.02

            self._send(200, {
                'prediction': round(pred),
                'ci_low':     round(pred * (1 - 1.645 * std_r)),
                'ci_high':    round(pred * (1 + 1.645 * std_r)),
                'volatility': round(std_r * 100, 2),
            })
        except Exception as e:
            self._send(500, {'error': str(e)})

    def do_OPTIONS(self):
        self._send(200, {})

    def _send(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def log_message(self, *args):
        pass
