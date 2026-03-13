from agents.budget_agent import run_budget_agent
from agents.stay_agent import run_stay_agent
from agents.experience_agent import run_experience_agent
from agents.logistics_agent import run_logistics_agent
from agents.booking_agent import run_booking_agent
from agents.food_agent import run_food_agent

def get_currency_symbol(destination):
    # Always return rupees (₹) as requested
    return "₹"

def run_multi_agent(destination, days, group_size, budget, trip_type, preferences, source_location, transport_mode="Flight", cost_level="moderate"):
    # budget is per-person value coming from the app
    currency = get_currency_symbol(destination)
    
    # Calculate total budget for the group
    total_budget = budget * group_size

    intro = (
        f"# 🗺️ TripTacticx – Your Travel Plan\n"
        f"## 🌍 Smart Travel Plan for: **{destination}** ({days} days)\n"
        f"**Group Size:** {group_size} | **Budget per Person:** {currency}{budget:.2f} | "
        f"**Trip Type:** {trip_type} | **Cost Level:** {cost_level}\n"
        f"**Preferred Transport:** {transport_mode}\n"
        f"**Preferences:** {preferences}\n"
        f"---\n"
    )

    budget_prompt = (
        f"Break down estimated trip expenses for {group_size} people over {days} days in {destination}. "
        f"All amounts must be in Indian Rupees (₹) only. "
        f"Suggest ways to save money."
    )

    # Pass total budget (group total) to budget agent
    budget_plan, category_budgets = run_budget_agent(
        prompt=budget_prompt,
        budget=total_budget,
        group_size=group_size,
        days=days,
        trip_type=trip_type,
        cost_level=cost_level
    )

    # Get per-person transport budget by dividing group transport budget by group size
    per_person_transport = category_budgets["transport"] / max(1, group_size)

    # Format budgets with currency symbol (group totals)
    stay_budget_str = f"{currency}{category_budgets['stay']:.2f}"
    experiences_budget_str = f"{currency}{category_budgets['experiences']:.2f}"
    food_budget_str = f"{currency}{category_budgets['food']:.2f}"
    transport_budget_str = f"{currency}{category_budgets['transport']:.2f}"

    booking_prompt = (
        f"Suggest suitable transport from {source_location} to {destination}. "
        f"The user prefers: **{transport_mode}**. "
        f"Focus heavily on {transport_mode} options with realistic timings and prices. "
        f"Only suggest alternatives if {transport_mode} is impossible. "
        f"Include realistic timings, price range, and estimated duration. "
        f"Consider per-person transport budget: {currency}{per_person_transport:.2f}. "
        f"All prices must be in Indian Rupees (₹) only."
    )
    stay_prompt = (
        f"Recommend the best places to stay in {destination} for a {trip_type.lower()} trip. "
        f"Group size: {group_size}. Budget per group for stay: {stay_budget_str}. "
        f"Preferences: {preferences}. All prices must be in Indian Rupees (₹) only."
    )
    experience_prompt = (
        f"Suggest day-wise activities, attractions, and cultural experiences in {destination} "
        f"for {days} days. Preferences: {preferences}. "
        f"Budget for experiences (group total): {experiences_budget_str}. "
        f"All prices must be in Indian Rupees (₹) only."
    )
    food_prompt = (
        f"Suggest must-try local dishes and the best places to eat in {destination}. "
        f"Include street food and unique culinary experiences. "
        f"Food budget for the group: {food_budget_str}. "
        f"All prices must be in Indian Rupees (₹) only."
    )
    logistics_prompt = (
        f"Explain local transport options and travel tips inside {destination}. "
        f"Include route and commuting suggestions. "
        f"Local transport budget (group total): {transport_budget_str}. "
        f"All prices must be in Indian Rupees (₹) only."
    )

    # Calculate per-person budgets for agents that need them
    per_person_stay = category_budgets["stay"] / max(1, group_size)
    per_person_experiences = category_budgets["experiences"] / max(1, group_size)
    per_person_food = category_budgets["food"] / max(1, group_size)
    per_person_logistics = category_budgets["transport"] / max(1, group_size)
    
    # Pass per-person transport budget into booking agent
    booking = run_booking_agent(booking_prompt, per_person_transport, group_size)
    stay = run_stay_agent(stay_prompt, per_person_stay, group_size, trip_type, preferences, days)
    experience = run_experience_agent(experience_prompt, per_person_experiences, days, preferences)
    food = run_food_agent(food_prompt, per_person_food, days)
    logistics = run_logistics_agent(logistics_prompt, per_person_logistics, days)

    agent_outputs = {
        "Booking Suggestions": booking,
        "Stay Options": stay,
        "Experiences": experience,
        "Local Food & Dining": food,
        "Travel Logistics": logistics,
        "Budget Planning": budget_plan,
    }

    summary_parts = [intro]
    for section, content in agent_outputs.items():
        summary_parts.append(
            f"### {section}\n{content.strip()}\n\n---\n"
        )
    summary_parts.append("*Generated by 🧭 TripTacticx Multi-Agent System*")

    summary = "\n".join(summary_parts)

    return summary, agent_outputs
