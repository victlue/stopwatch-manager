"use client";
import React, { useEffect, useState } from "react";
import { Recipe } from "@/app/types/recipe";

interface RecipeViewerProps {
  onManageRecipes: () => void;
}

export default function RecipeViewer({ onManageRecipes }: RecipeViewerProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/recipes");
      if (!response.ok) throw new Error("Failed to fetch recipes");
      const data = await response.json();
      setRecipes(data);
      if (data.length > 0 && !selectedRecipe) {
        setSelectedRecipe(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  if (recipes.length === 0) {
    return (
      <div className="recipe-viewer-empty">
        <p>No recipes yet.</p>
        <button className="primary" onClick={onManageRecipes}>
          Manage Recipes
        </button>
        <style jsx>{`
          .recipe-viewer-empty {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            margin-bottom: 20px;
          }
          .recipe-viewer-empty p {
            margin: 0 0 12px;
            color: #6b7280;
          }
          button {
            appearance: none;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 9999px;
            padding: 8px 14px;
            font-weight: 700;
            cursor: pointer;
          }
          button.primary {
            background: #111827;
            color: white;
            border-color: #111827;
          }
          button.primary:hover {
            background: #000;
          }
          @media (prefers-color-scheme: dark) {
            .recipe-viewer-empty {
              background: #111214;
              border-color: #26272b;
            }
            .recipe-viewer-empty p {
              color: #9ca3af;
            }
            button.primary {
              background: #e5e7eb;
              color: #111827;
              border-color: #e5e7eb;
            }
            button.primary:hover {
              background: #fff;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`recipe-viewer ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="recipe-viewer-header">
        <div className="recipe-selector">
          <label>Recipe:</label>
          <select 
            value={selectedRecipe?.id || ''} 
            onChange={(e) => {
              const recipe = recipes.find(r => r.id === e.target.value);
              setSelectedRecipe(recipe || null);
            }}
          >
            {recipes.map(recipe => (
              <option key={recipe.id} value={recipe.id}>
                {recipe.title}
              </option>
            ))}
          </select>
        </div>
        <div className="recipe-controls">
          <button onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
          <button onClick={onManageRecipes}>
            Edit
          </button>
        </div>
      </div>
      
      {selectedRecipe && (
        <div className="recipe-viewer-content">
          <h3>{selectedRecipe.title}</h3>
          <div className="recipe-text">
            {selectedRecipe.content.split('\n').map((line, i) => (
              <React.Fragment key={i}>
                {line}
                {i < selectedRecipe.content.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .recipe-viewer {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          margin-bottom: 20px;
          transition: all 0.3s ease;
        }

        .recipe-viewer.collapsed {
          max-height: 300px;
        }

        .recipe-viewer.expanded {
          max-height: 600px;
        }

        .recipe-viewer-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .recipe-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
        }

        .recipe-selector label {
          font-weight: 600;
          font-size: 14px;
        }

        .recipe-selector select {
          flex: 1;
          max-width: 300px;
          padding: 6px 10px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }

        .recipe-controls {
          display: flex;
          gap: 8px;
        }

        .recipe-viewer-content {
          padding: 16px;
          overflow-y: auto;
          max-height: calc(100% - 60px);
        }

        .recipe-viewer.collapsed .recipe-viewer-content {
          max-height: 240px;
        }

        .recipe-viewer.expanded .recipe-viewer-content {
          max-height: 540px;
        }

        .recipe-viewer-content h3 {
          margin: 0 0 12px;
          font-size: 18px;
          font-weight: 700;
        }

        .recipe-text {
          font-size: 15px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        button {
          appearance: none;
          border: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 9999px;
          padding: 6px 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
        }

        button:hover {
          background: #f3f4f6;
        }

        @media (prefers-color-scheme: dark) {
          .recipe-viewer {
            background: #111214;
            border-color: #26272b;
          }

          .recipe-viewer-header {
            border-color: #26272b;
          }

          .recipe-selector select {
            background: #0b0b0c;
            border-color: #26272b;
            color: #e5e7eb;
          }

          .recipe-viewer-content h3 {
            color: #e5e7eb;
          }

          .recipe-text {
            color: #e5e7eb;
          }

          button {
            border-color: #26272b;
            background: #1a1b1e;
            color: #e5e7eb;
          }

          button:hover {
            background: #232428;
          }
        }
      `}</style>
    </div>
  );
}