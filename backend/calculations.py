from models import UserProfile, MacroTargets

def calculate_bmr(profile: UserProfile) -> float:
    """
    Calculate Basal Metabolic Rate using Mifflin-St Jeor Equation
    Men: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5
    Women: (10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161
    """
    base = (10 * profile.weight_kg) + (6.25 * profile.height_cm) - (5 * profile.age)
    
    if profile.gender == "male":
        bmr = base + 5
    else:
        bmr = base - 161
    
    return round(bmr, 2)

def calculate_tdee(bmr: float, activity_level: float) -> float:
    """
    Calculate Total Daily Energy Expenditure
    TDEE = BMR × Activity Multiplier
    """
    return round(bmr * activity_level, 2)

def calculate_macros(profile: UserProfile) -> MacroTargets:
    """
    Calculate daily macro targets based on user profile
    - Protein: 2.0g per kg of body weight
    - Fat: 25% of total daily calories
    - Carbs: Remaining calories
    """
    # Calculate BMR and TDEE
    bmr = calculate_bmr(profile)
    tdee = calculate_tdee(bmr, profile.activity_level)
    
    # Adjust TDEE based on goal
    if profile.goal == "lose":
        target_calories = tdee * 0.85  # 15% deficit
    elif profile.goal == "gain":
        target_calories = tdee * 1.10  # 10% surplus
    else:  # maintain
        target_calories = tdee
    
    # Calculate protein (2g per kg)
    protein_g = round(profile.weight_kg * 2.0, 2)
    protein_calories = protein_g * 4  # 4 calories per gram of protein
    
    # Calculate fat (25% of total calories)
    fat_calories = target_calories * 0.25
    fat_g = round(fat_calories / 9, 2)  # 9 calories per gram of fat
    
    # Calculate carbs (remaining calories)
    remaining_calories = target_calories - protein_calories - fat_calories
    carbs_g = round(remaining_calories / 4, 2)  # 4 calories per gram of carbs
    
    return MacroTargets(
        calories=round(target_calories, 2),
        protein_g=protein_g,
        carbs_g=carbs_g,
        fat_g=fat_g,
        bmr=bmr,
        tdee=tdee
    )
