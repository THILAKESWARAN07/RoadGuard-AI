class RiskService:
    def score(self, severity: str, detection_count: int, citizen_reports: int = 0) -> int:
        severity_weight = {"small": 20, "medium": 50, "large": 80}.get(severity.lower(), 40)
        score = severity_weight + min(detection_count * 2, 15) + min(citizen_reports * 3, 10)
        return max(0, min(score, 100))
