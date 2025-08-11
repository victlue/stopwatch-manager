import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import { Recipe } from '@/app/types/recipe';

const RECIPES_KEY = 'recipes';

export async function GET() {
  try {
    const recipes = await kv.get<Recipe[]>(RECIPES_KEY) || [];
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Failed to fetch recipes:', error);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const recipes = await kv.get<Recipe[]>(RECIPES_KEY) || [];
    
    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    recipes.push(newRecipe);
    await kv.set(RECIPES_KEY, recipes);

    return NextResponse.json(newRecipe, { status: 201 });
  } catch (error) {
    console.error('Failed to create recipe:', error);
    return NextResponse.json(
      { error: 'Failed to create recipe' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, title, and content are required' },
        { status: 400 }
      );
    }

    const recipes = await kv.get<Recipe[]>(RECIPES_KEY) || [];
    const index = recipes.findIndex(r => r.id === id);

    if (index === -1) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    recipes[index] = {
      ...recipes[index],
      title,
      content,
      updatedAt: Date.now(),
    };

    await kv.set(RECIPES_KEY, recipes);

    return NextResponse.json(recipes[index]);
  } catch (error) {
    console.error('Failed to update recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const recipes = await kv.get<Recipe[]>(RECIPES_KEY) || [];
    const filteredRecipes = recipes.filter(r => r.id !== id);

    if (recipes.length === filteredRecipes.length) {
      return NextResponse.json(
        { error: 'Recipe not found' },
        { status: 404 }
      );
    }

    await kv.set(RECIPES_KEY, filteredRecipes);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}