"""
Context analyzer for generating intelligent instructions based on page context

⚠️ PLACEHOLDER IMPLEMENTATION ⚠️

This module provides a DEMO implementation using rule-based logic to show
how context analysis and instruction generation would work. In a production
system, this should be replaced with LLM-powered analysis for sophisticated
understanding of page context, user intent, and intelligent instruction generation.

Current implementation demonstrates:
- Basic form validation detection
- Simple page type classification
- Rule-based instruction generation
- Example instruction types and formats

For production use, integrate with:
- OpenAI GPT, Anthropic Claude, or other LLMs
- Custom trained models for specific domains
- Advanced context understanding algorithms
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from .types import (
    PageContext,
    ContextAnalysis,
    ContextAnalysisIssue,
    ContextAnalysisSuggestion,
)


class ContextAnalyzer:
    """
    Analyzes page context to generate intelligent instructions and suggestions

    ⚠️ DEMO IMPLEMENTATION - Replace with LLM integration for production use

    This class uses simple rule-based logic to demonstrate the concept.
    For real-world applications, replace with:
    - LLM-powered context understanding
    - Machine learning models
    - Advanced NLP analysis
    """

    def __init__(self):
        self.form_patterns = {
            "email": r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}",
            "phone": r"(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}",
            "url": r'https?://[^\s<>"{}|\\^`\[\]]+',
            "required_field": r"required|mandatory|\*",
        }

    def analyze_context(self, context: PageContext) -> ContextAnalysis:
        """
        Analyze page context and return analysis results

        ⚠️ PLACEHOLDER: This uses simple heuristics. Replace with LLM analysis:

        Example LLM integration:
        ```python
        async def analyze_context_with_llm(self, context):
            prompt = f'''
            Analyze this web page context and provide insights:
            URL: {context.url}
            Title: {context.title}
            Forms: {len(context.dom.forms)} forms found
            Text Content: {context.dom.text[:500]}...

            Please analyze:
            1. Page type (form, checkout, dashboard, etc.)
            2. User intent (browsing, form_filling, purchasing, etc.)
            3. Issues (validation, usability, accessibility)
            4. Suggestions for improvements
            '''

            response = await self.llm_client.complete(prompt)
            return self.parse_llm_analysis(response)
        ```
        """
        page_type = self._determine_page_type(context)
        user_intent = self._infer_user_intent(context, page_type)
        issues = self._identify_issues(context)
        suggestions = self._generate_suggestions(context, page_type, issues)
        confidence = self._calculate_confidence(context, issues, suggestions)

        return ContextAnalysis(
            pageType=page_type,
            userIntent=user_intent,
            issues=issues,
            suggestions=suggestions,
            confidence=confidence,
        )

    def generate_instructions(
        self, context: PageContext, analysis: ContextAnalysis
    ) -> List[Dict[str, Any]]:
        """
        Generate specific instructions based on context analysis

        ⚠️ DEMO: Uses rule-based instruction generation.
        In production, use LLM to generate contextually appropriate instructions.
        """
        instructions: List[Dict[str, Any]] = []

        # Form-related instructions
        if analysis.pageType == "form":
            instructions.extend(self._generate_form_instructions(context, analysis))

        # Checkout-related instructions
        if analysis.pageType == "checkout":
            instructions.extend(self._generate_checkout_instructions(context, analysis))

        # Error page instructions
        if analysis.pageType == "error":
            instructions.extend(self._generate_error_instructions(context, analysis))

        # General usability instructions
        instructions.extend(self._generate_usability_instructions(context, analysis))

        # Issue-based instructions
        for issue in analysis.issues or []:
            instructions.extend(self._generate_issue_instructions(issue, context))

        return instructions

    def _determine_page_type(self, context: PageContext) -> str:
        """
        Determine the type of page based on context
        """
        url = context.url.lower()
        title = context.title.lower()
        text = context.dom.text.lower() if context.dom and context.dom.text else ""

        # Check for specific page types
        if any(
            keyword in url for keyword in ["checkout", "cart", "payment", "billing"]
        ):
            return "checkout"

        if any(keyword in url for keyword in ["dashboard", "admin", "panel"]):
            return "dashboard"

        if any(
            keyword in title + text
            for keyword in ["error", "404", "500", "not found", "server error"]
        ):
            return "error"

        if any(
            keyword in title + text
            for keyword in ["loading", "please wait", "processing"]
        ):
            return "loading"

        # Check for forms
        if context.dom and context.dom.forms and len(context.dom.forms) > 0:
            return "form"

        # Default to content page
        return "content"

    def _infer_user_intent(
        self, _context: PageContext, page_type: str
    ) -> Optional[str]:
        """
        Infer user intent based on context and page type
        """
        if page_type == "form":
            return "form_filling"
        elif page_type == "checkout":
            return "purchasing"
        elif page_type == "dashboard":
            return "browsing"
        else:
            # Analyze user behavior patterns if available
            return "browsing"

    def _identify_issues(self, context: PageContext) -> List[ContextAnalysisIssue]:
        """
        Identify potential issues on the page
        """
        issues: List[ContextAnalysisIssue] = []

        if not context.dom:
            return issues

        # Check for empty required fields
        if context.dom.inputs:
            for input_field in context.dom.inputs:
                if input_field.required and not input_field.value:
                    issues.append(
                        ContextAnalysisIssue(
                            type="validation",
                            severity="medium",
                            message=f"Required field '{input_field.name or input_field.id}' is empty",
                            element=(
                                f"#{input_field.id}"
                                if input_field.id
                                else f"[name='{input_field.name}']"
                            ),
                        )
                    )

        # Check for accessibility issues
        if context.dom.inputs:
            for input_field in context.dom.inputs:
                if not input_field.placeholder and not input_field.name:
                    issues.append(
                        ContextAnalysisIssue(
                            type="accessibility",
                            severity="low",
                            message="Input field missing label or placeholder",
                            element=(
                                f"#{input_field.id}" if input_field.id else "input"
                            ),
                        )
                    )

        # Check for performance issues (large text content)
        if context.dom.text and len(context.dom.text) > 50000:
            issues.append(
                ContextAnalysisIssue(
                    type="performance",
                    severity="medium",
                    message="Page contains large amount of text content",
                    element="body",
                )
            )

        # Check for usability issues
        if context.viewport:
            if context.viewport.width < 768:  # Mobile viewport
                issues.append(
                    ContextAnalysisIssue(
                        type="usability",
                        severity="low",
                        message="Mobile viewport detected - ensure responsive design",
                        element="viewport",
                    )
                )

        return issues

    def _generate_suggestions(
        self, context: PageContext, page_type: str, issues: List[ContextAnalysisIssue]
    ) -> List[ContextAnalysisSuggestion]:
        """
        Generate suggestions based on context and issues
        """
        suggestions = []

        # Page-type specific suggestions
        if page_type == "form" and context.dom and context.dom.forms:
            suggestions.append(
                ContextAnalysisSuggestion(
                    type="improvement",
                    message="Consider adding form validation feedback",
                    action="add_validation",
                )
            )

        if page_type == "checkout":
            suggestions.append(
                ContextAnalysisSuggestion(
                    type="next_step",
                    message="Review your order before proceeding to payment",
                    action="review_order",
                )
            )

        # Issue-based suggestions
        validation_issues = [i for i in issues if i.type == "validation"]
        if validation_issues:
            suggestions.append(
                ContextAnalysisSuggestion(
                    type="improvement",
                    message=f"Fix {len(validation_issues)} validation issues before proceeding",
                    action="fix_validation",
                )
            )

        return suggestions

    def _calculate_confidence(
        self,
        context: PageContext,
        issues: List[ContextAnalysisIssue],
        _suggestions: List[ContextAnalysisSuggestion],
    ) -> float:
        """
        Calculate confidence score for the analysis
        """
        confidence = 0.5  # Base confidence

        # Increase confidence based on available data
        if context.dom and context.dom.text:
            confidence += 0.2

        if context.dom and context.dom.forms:
            confidence += 0.1

        if context.viewport:
            confidence += 0.1

        # Adjust based on issues found
        if issues:
            confidence += min(0.2, len(issues) * 0.05)

        return min(1.0, confidence)

    def _generate_form_instructions(
        self, context: PageContext, _analysis: ContextAnalysis
    ) -> List[Dict[str, Any]]:
        """
        Generate form-specific instructions
        """
        instructions: List[Dict[str, Any]] = []

        if not context.dom or not context.dom.forms:
            return instructions

        for form in context.dom.forms:
            # Check for empty required fields
            required_empty_fields = [
                field for field in form.fields if field.required and not field.value
            ]

            if required_empty_fields:
                for field in required_empty_fields[:3]:  # Limit to first 3 fields
                    selector = f"#{field.id}" if field.id else f"[name='{field.name}']"
                    instructions.append(
                        {
                            "id": str(uuid.uuid4()),
                            "type": "form_assistance",
                            "timestamp": int(datetime.now().timestamp() * 1000),
                            "priority": "medium",
                            "data": {
                                "action": "highlight_field",
                                "selector": selector,
                                "message": f"This field is required: {field.name or field.id or 'Field'}",
                            },
                        }
                    )

            # Suggest form completion
            if len(required_empty_fields) > 0:
                instructions.append(
                    {
                        "id": str(uuid.uuid4()),
                        "type": "contextual_notification",
                        "timestamp": int(datetime.now().timestamp() * 1000),
                        "priority": "medium",
                        "data": {
                            "message": f"Please complete {len(required_empty_fields)} required fields to continue",
                            "notificationType": "info",
                            "actions": [
                                {
                                    "label": "Highlight Fields",
                                    "action": "highlight_required_fields",
                                }
                            ],
                            "autoClose": False,
                        },
                    }
                )

        return instructions

    def _generate_checkout_instructions(
        self, _context: PageContext, _analysis: ContextAnalysis
    ) -> List[Dict[str, Any]]:
        """
        Generate checkout-specific instructions
        """
        instructions = []

        # Suggest reviewing order
        instructions.append(
            {
                "id": str(uuid.uuid4()),
                "type": "contextual_notification",
                "timestamp": int(datetime.now().timestamp() * 1000),
                "priority": "high",
                "data": {
                    "message": "You're in the checkout process. Please review your order carefully.",
                    "notificationType": "info",
                    "autoClose": False,
                },
            }
        )

        return instructions

    def _generate_error_instructions(
        self, _context: PageContext, _analysis: ContextAnalysis
    ) -> List[Dict[str, Any]]:
        """
        Generate error page instructions
        """
        instructions = []

        instructions.append(
            {
                "id": str(uuid.uuid4()),
                "type": "contextual_notification",
                "timestamp": int(datetime.now().timestamp() * 1000),
                "priority": "high",
                "data": {
                    "message": "It looks like there's an error on this page. Would you like to go back or try refreshing?",
                    "notificationType": "error",
                    "actions": [
                        {"label": "Go Back", "action": "go_back"},
                        {"label": "Refresh", "action": "refresh"},
                    ],
                    "autoClose": False,
                },
            }
        )

        return instructions

    def _generate_usability_instructions(
        self, context: PageContext, _analysis: ContextAnalysis
    ) -> List[Dict[str, Any]]:
        """
        Generate general usability instructions
        """
        instructions = []

        # Mobile-specific instructions
        if context.viewport and context.viewport.width < 768:
            instructions.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "content_instruction",
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "priority": "low",
                    "data": {
                        "action": "show_tooltip",
                        "selector": "body",
                        "content": "Tip: You're viewing this on a mobile device. Tap and hold for more options.",
                        "position": "top",
                        "duration": 5000,
                    },
                }
            )

        return instructions

    def _generate_issue_instructions(
        self, issue: ContextAnalysisIssue, _context: PageContext
    ) -> List[Dict[str, Any]]:
        """
        Generate instructions based on specific issues
        """
        instructions = []

        if issue.type == "validation" and issue.element:
            instructions.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "form_assistance",
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "priority": "high" if issue.severity == "high" else "medium",
                    "data": {
                        "action": "show_error",
                        "selector": issue.element,
                        "message": issue.message,
                    },
                }
            )

        elif issue.type == "accessibility":
            instructions.append(
                {
                    "id": str(uuid.uuid4()),
                    "type": "contextual_notification",
                    "timestamp": int(datetime.now().timestamp() * 1000),
                    "priority": "low",
                    "data": {
                        "message": f"Accessibility issue detected: {issue.message}",
                        "notificationType": "warning",
                        "autoClose": True,
                        "duration": 8000,
                    },
                }
            )

        return instructions

    def analyze_user_behavior(
        self, context_history: List[PageContext]
    ) -> Dict[str, Any]:
        """
        Analyze user behavior patterns from context history
        """
        if not context_history:
            return {}

        # Analyze page visit patterns
        urls = [ctx.url for ctx in context_history]
        page_types = [self._determine_page_type(ctx) for ctx in context_history]

        # Calculate time spent on pages
        time_spent: Dict[str, int] = {}
        for i in range(len(context_history) - 1):
            current = context_history[i]
            next_ctx = context_history[i + 1]
            time_diff = next_ctx.timestamp - current.timestamp
            time_spent[current.url] = time_spent.get(current.url, 0) + time_diff

        return {
            "pages_visited": len(set(urls)),
            "page_types": list(set(page_types)),
            "average_time_per_page": (
                sum(time_spent.values()) / len(time_spent) if time_spent else 0
            ),
            "most_visited_page_type": (
                max(set(page_types), key=page_types.count) if page_types else None
            ),
            "behavior_patterns": self._identify_behavior_patterns(context_history),
        }

    def _identify_behavior_patterns(
        self, context_history: List[PageContext]
    ) -> List[str]:
        """
        Identify specific behavior patterns
        """
        patterns: List[str] = []

        if len(context_history) < 2:
            return patterns

        # Check for form abandonment
        form_pages = [
            ctx for ctx in context_history if self._determine_page_type(ctx) == "form"
        ]
        if len(form_pages) > 1:
            # Check if user left forms without completing
            for form_ctx in form_pages:
                if form_ctx.dom and form_ctx.dom.inputs:
                    empty_required = [
                        inp
                        for inp in form_ctx.dom.inputs
                        if inp.required and not inp.value
                    ]
                    if empty_required:
                        patterns.append("form_abandonment")
                        break

        # Check for checkout abandonment
        checkout_pages = [
            ctx
            for ctx in context_history
            if self._determine_page_type(ctx) == "checkout"
        ]
        if checkout_pages and not any(
            "success" in ctx.url.lower() or "thank" in ctx.url.lower()
            for ctx in context_history
        ):
            patterns.append("checkout_abandonment")

        # Check for error encounters
        error_pages = [
            ctx for ctx in context_history if self._determine_page_type(ctx) == "error"
        ]
        if error_pages:
            patterns.append("error_encountered")

        return patterns
