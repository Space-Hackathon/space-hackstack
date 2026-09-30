"""Pluggable ML pipeline: preprocessing -> inference -> postprocessing.

Drop model weights in ``app/ml/models/`` (see ``MODEL_PATH``) and replace the
placeholder logic in the three stage modules. The API in
``app/api/routes/ml.py`` calls ``pipeline.predict`` and does not need to change.
"""
