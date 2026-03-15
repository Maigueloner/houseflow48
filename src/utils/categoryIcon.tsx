import {
    Utensils,
    Home,
    HeartPulse,
    Smile,
    Bus,
    Cat,
    ShoppingCart,
    Scale,
    Cigarette,
    Database,
    Plane,
    Zap,
    PiggyBank,
    Tag,
    type LucideProps,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
    utensils: Utensils,
    home: Home,
    'heart-pulse': HeartPulse,
    smile: Smile,
    bus: Bus,
    cat: Cat,
    'shopping-cart': ShoppingCart,
    scale: Scale,
    cigarette: Cigarette,
    database: Database,
    plane: Plane,
    zap: Zap,
    'piggy-bank': PiggyBank,
    tag: Tag,
};

/**
 * All icon names available in the icon picker.
 * Exported so CategoriesCard can iterate over them.
 */
export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

/**
 * Returns a Lucide icon component for the given icon name.
 * Falls back to <Tag /> for null or unknown values.
 */
export function getCategoryIcon(
    name: string | null | undefined,
    size: number = 16
): React.ReactElement {
    const Icon = (name && ICON_MAP[name]) ? ICON_MAP[name] : Tag;
    return <Icon size={size} />;
}
