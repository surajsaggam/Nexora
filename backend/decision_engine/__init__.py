"""
NEXORA Decision Engine Package
Exports:
- DecisionEngine, DecisionResult, CandidateEvaluation
- CandidateAction, generate_candidate_actions
- WhatIfResult, evaluate_what_if
- SafetyGate, SafetyGateResult, SafetyCheck
- RecommendationObject, build_recommendation
"""

from backend.decision_engine.candidates import CandidateAction, generate_candidate_actions
from backend.decision_engine.engine import CandidateEvaluation, DecisionEngine, DecisionResult
from backend.decision_engine.recommendation import RecommendationObject, build_recommendation
from backend.decision_engine.safety_gate import SafetyCheck, SafetyGate, SafetyGateResult
from backend.decision_engine.what_if import TrajectoryPoint, WhatIfResult, evaluate_what_if

__all__ = [
    "DecisionEngine",
    "DecisionResult",
    "CandidateEvaluation",
    "CandidateAction",
    "generate_candidate_actions",
    "WhatIfResult",
    "evaluate_what_if",
    "TrajectoryPoint",
    "SafetyGate",
    "SafetyGateResult",
    "SafetyCheck",
    "RecommendationObject",
    "build_recommendation",
]
