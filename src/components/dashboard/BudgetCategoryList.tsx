import React from 'react';
import BudgetCategoryItem from './BudgetCategoryItem';

export interface BudgetCategory {
    category_id: string;
    category_name: string;
    budget_eur: number | null;
    spent_eur: number;
    remaining_eur: number | null;
    percent_used: number;
}

interface Props {
    categories: BudgetCategory[];
    monthDateDay1: string;
}

export default function BudgetCategoryList({ categories, monthDateDay1 }: Props) {
    return (
        <div className="flex flex-col">
            {categories.map((cat) => (
                <BudgetCategoryItem 
                    key={cat.category_id} 
                    category={cat} 
                    monthDateDay1={monthDateDay1} 
                />
            ))}
        </div>
    );
}
