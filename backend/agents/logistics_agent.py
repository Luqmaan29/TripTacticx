from utils.groq_wrapper import ask_groq

def run_logistics_agent(prompt, budget, days):
    """
    Generates local transport and logistics recommendations for the trip.

    Parameters:
    - prompt (str): The user prompt describing the trip context.
    - budget (float): Per-person budget for local transport (already calculated in run_multi_agent).
    - days (int): Number of days in the itinerary.

    Returns:
    - str: The AI-generated logistics guide.
    """
    messages = [
        {
            "role": "system",
            "content": (
                f"You are a transport and local travel expert. Suggest the best ways to move around the destination "
                f"for {days} days within a local transport budget of ₹{budget:.2f} per person. "
                f"IMPORTANT: ALL prices and amounts MUST be in Indian Rupees (₹) only. Use ₹ symbol for all prices. "
                "Do NOT use dollars ($), euros (€), or any other currency. "
                "Include common routes, public transport passes, ride-sharing tips, and walking options. "
                "Mention safety, frequency, and costs."
            )
        },
        {"role": "user", "content": prompt},
    ]
    return ask_groq("llama-3.1-8b-instant", messages)
