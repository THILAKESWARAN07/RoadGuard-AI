from difflib import SequenceMatcher


class SimilarityService:
    def image_similarity(self, image_a: str | None, image_b: str | None) -> float:
        if not image_a or not image_b:
            return 0.0
        return SequenceMatcher(None, image_a.lower().strip(), image_b.lower().strip()).ratio()
