"""
TDEE and macro target calculations using the Mifflin-St Jeor equation.
"""
from models.user import Gender, ActivityLevel, DietaryGoal, MacroTargets


ACTIVITY_MULTIPLIERS = {
    ActivityLevel.sedentary: 1.2,
    ActivityLevel.lightly_active: 1.375,
    ActivityLevel.moderately_active: 1.55,
    ActivityLevel.very_active: 1.725,
    ActivityLevel.extra_active: 1.9,
}


def calculate_bmr(weight_kg: float, height_cm: float, age: int, gender: Gender) -> float:
    """Mifflin-St Jeor BMR formula."""
    if gender == Gender.male:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
    else:
        return 10 * weight_kg + 6.25 * height_cm - 5 * age - 161


def calculate_tdee(bmr: float, activity_level: ActivityLevel) -> float:
    return bmr * ACTIVITY_MULTIPLIERS[activity_level]


def calculate_macro_targets(tdee: float, goal: DietaryGoal, weight_kg: float) -> MacroTargets:
    """
    Calculate daily macro targets based on TDEE and goal.
    Protein: 1.6-2.2g/kg body weight for muscle gain, 1.2-1.6g/kg for others.
    Fat: 25-35% of calories.
    Carbs: remainder.
    """
    calorie_adjustment = {
        DietaryGoal.lose_weight: -500,
        DietaryGoal.maintain_weight: 0,
        DietaryGoal.gain_muscle: 300,
        DietaryGoal.improve_health: 0,
    }

    protein_per_kg = {
        DietaryGoal.lose_weight: 1.8,
        DietaryGoal.maintain_weight: 1.4,
        DietaryGoal.gain_muscle: 2.0,
        DietaryGoal.improve_health: 1.4,
    }

    target_calories = tdee + calorie_adjustment[goal]
    protein_g = weight_kg * protein_per_kg[goal]
    fat_g = (target_calories * 0.30) / 9  # 30% of calories from fat
    protein_calories = protein_g * 4
    fat_calories = fat_g * 9
    carbs_g = (target_calories - protein_calories - fat_calories) / 4
    fiber_g = target_calories / 1000 * 14  # ~14g per 1000 kcal (DRI guideline)

    return MacroTargets(
        calories=round(target_calories),
        protein_g=round(protein_g, 1),
        carbs_g=round(max(carbs_g, 0), 1),
        fat_g=round(fat_g, 1),
        fiber_g=round(fiber_g, 1),
    )
