# budget_agent.py
from utils.groq_wrapper import ask_groq

# Dynamic allocation presets
BUDGET_PROFILES = {
    "Leisure":      {"transport": 0.20, "stay": 0.35, "experiences": 0.25, "food": 0.15, "misc": 0.05},
    "Adventure":    {"transport": 0.25, "stay": 0.25, "experiences": 0.35, "food": 0.10, "misc": 0.05},
    "Honeymoon":    {"transport": 0.15, "stay": 0.45, "experiences": 0.20, "food": 0.15, "misc": 0.05},
    "Solo":         {"transport": 0.20, "stay": 0.30, "experiences": 0.30, "food": 0.15, "misc": 0.05},
    "Business":     {"transport": 0.25, "stay": 0.40, "experiences": 0.15, "food": 0.15, "misc": 0.05}
}

# Cost-of-living multipliers
DESTINATION_COST = {
    "cheap": 0.8,
    "moderate": 1.0,
    "expensive": 1.3
}

def run_budget_agent(prompt, budget, group_size, days, trip_type="Leisure", cost_level="moderate"):
    """
    budget: TOTAL group budget (not per-person) - already multiplied by group_size
    returns: (ai_response_text, category_budgets) where category_budgets are GROUP totals
    """
    # Adjust total group budget for cost-of-living
    adjusted_total_budget = budget * DESTINATION_COST.get(cost_level, 1.0)
    
    # Calculate per-person budget for display
    adjusted_budget_per_person = adjusted_total_budget / max(1, group_size)

    # Total group budget (group totals returned)
    total_budget_group = adjusted_total_budget

    # Allocation profile
    allocation = BUDGET_PROFILES.get(trip_type, BUDGET_PROFILES["Leisure"])

    # Calculate category budgets (group totals)
    category_budgets = {cat: round(total_budget_group * pct, 2) for cat, pct in allocation.items()}

    # Prepare AI system message
    messages = [
        {
            "role": "system",
            "content": (
                f"You are a professional travel budget planner for a {days}-day {trip_type.lower()} trip. "
                f"Group size: {group_size} people. "
                f"Destination cost level: {cost_level}. "
                f"IMPORTANT: ALL amounts must be in Indian Rupees (₹). Use ₹ symbol for all prices and amounts. "
                f"Budget per person: ₹{adjusted_budget_per_person:.2f}. "
                f"Total group budget: ₹{total_budget_group:.2f}.\n\n"
                f"Budget Allocation (all amounts in ₹):\n"
                f"- Transport: ₹{category_budgets['transport']:.2f}\n"
                f"- Stay: ₹{category_budgets['stay']:.2f}\n"
                f"- Experiences: ₹{category_budgets['experiences']:.2f}\n"
                f"- Food: ₹{category_budgets['food']:.2f}\n"
                f"- Misc: ₹{category_budgets['misc']:.2f}\n\n"
                "Give a clear table with daily spending limits and 3 money-saving tips. "
                "ALL amounts in your response MUST be in Indian Rupees (₹) only. Do NOT use dollars ($), euros (€), or any other currency."
            )
        },
        {"role": "user", "content": prompt}
    ]

    ai_response = ask_groq("llama-3.1-8b-instant", messages)

    return ai_response, category_budgets
