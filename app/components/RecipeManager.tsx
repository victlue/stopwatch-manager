"use client";
import React, { useEffect, useState } from "react";
import { Recipe } from "@/app/types/recipe";

export default function RecipeManager() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", content: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError(null);
    } catch (err) {
      setError("Failed to load recipes");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createRecipe = async () => {
    if (!editForm.title.trim() || !editForm.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      const response = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) throw new Error("Failed to create recipe");
      
      const newRecipe = await response.json();
      setRecipes([...recipes, newRecipe]);
      setSelectedRecipe(newRecipe);
      setIsCreating(false);
      setEditForm({ title: "", content: "" });
      setError(null);
    } catch (err) {
      setError("Failed to create recipe");
      console.error(err);
    }
  };

  const updateRecipe = async () => {
    if (!selectedRecipe || !editForm.title.trim() || !editForm.content.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      const response = await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedRecipe.id,
          title: editForm.title,
          content: editForm.content,
        }),
      });

      if (!response.ok) throw new Error("Failed to update recipe");
      
      const updatedRecipe = await response.json();
      setRecipes(recipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      setSelectedRecipe(updatedRecipe);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError("Failed to update recipe");
      console.error(err);
    }
  };

  const deleteRecipe = async (id: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;

    try {
      const response = await fetch(`/api/recipes?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete recipe");
      
      setRecipes(recipes.filter(r => r.id !== id));
      if (selectedRecipe?.id === id) {
        setSelectedRecipe(null);
      }
      setError(null);
    } catch (err) {
      setError("Failed to delete recipe");
      console.error(err);
    }
  };

  const startEditing = () => {
    if (selectedRecipe) {
      setEditForm({ title: selectedRecipe.title, content: selectedRecipe.content });
      setIsEditing(true);
    }
  };

  const startCreating = () => {
    setEditForm({ title: "", content: "" });
    setIsCreating(true);
    setSelectedRecipe(null);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setIsCreating(false);
    setEditForm({ title: "", content: "" });
  };

  if (loading) {
    return <div className="recipe-loading">Loading recipes...</div>;
  }

  return (
    <div className="recipe-manager">
      <div className="recipe-sidebar">
        <div className="recipe-header">
          <h2>Recipes</h2>
          <button className="primary small" onClick={startCreating}>
            + New
          </button>
        </div>
        
        {error && <div className="recipe-error">{error}</div>}
        
        <div className="recipe-list">
          {recipes.length === 0 ? (
            <div className="recipe-empty">No recipes yet</div>
          ) : (
            recipes.map(recipe => (
              <div
                key={recipe.id}
                className={`recipe-item ${selectedRecipe?.id === recipe.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedRecipe(recipe);
                  setIsEditing(false);
                  setIsCreating(false);
                }}
              >
                {recipe.title}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="recipe-content">
        {isCreating ? (
          <div className="recipe-editor">
            <input
              type="text"
              className="recipe-title-input"
              placeholder="Recipe Title"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <textarea
              className="recipe-content-input"
              placeholder="Recipe content..."
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            />
            <div className="recipe-actions">
              <button className="primary" onClick={createRecipe}>
                Create Recipe
              </button>
              <button onClick={cancelEdit}>Cancel</button>
            </div>
          </div>
        ) : isEditing && selectedRecipe ? (
          <div className="recipe-editor">
            <input
              type="text"
              className="recipe-title-input"
              value={editForm.title}
              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
            />
            <textarea
              className="recipe-content-input"
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
            />
            <div className="recipe-actions">
              <button className="primary" onClick={updateRecipe}>
                Save Changes
              </button>
              <button onClick={cancelEdit}>Cancel</button>
              <button 
                className="danger" 
                onClick={() => deleteRecipe(selectedRecipe.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ) : selectedRecipe ? (
          <div className="recipe-display">
            <div className="recipe-display-header">
              <h3>{selectedRecipe.title}</h3>
              <button onClick={startEditing}>Edit</button>
            </div>
            <div className="recipe-display-content">
              {selectedRecipe.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < selectedRecipe.content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          </div>
        ) : (
          <div className="recipe-placeholder">
            Select a recipe or create a new one
          </div>
        )}
      </div>

      <style jsx>{`
        .recipe-manager {
          display: flex;
          gap: 20px;
          margin-top: 20px;
          min-height: 400px;
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 16px;
          overflow: hidden;
        }

        .recipe-sidebar {
          width: 250px;
          border-right: 1px solid #e5e7eb;
          display: flex;
          flex-direction: column;
        }

        .recipe-header {
          padding: 16px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .recipe-header h2 {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
        }

        .recipe-error {
          padding: 8px 16px;
          background: #fef2f2;
          color: #991b1b;
          font-size: 14px;
        }

        .recipe-list {
          flex: 1;
          overflow-y: auto;
        }

        .recipe-empty {
          padding: 16px;
          color: #6b7280;
          text-align: center;
        }

        .recipe-item {
          padding: 12px 16px;
          cursor: pointer;
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.2s;
        }

        .recipe-item:hover {
          background: #f9fafb;
        }

        .recipe-item.selected {
          background: #f0f9ff;
          border-left: 3px solid #3b82f6;
          padding-left: 13px;
        }

        .recipe-content {
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }

        .recipe-loading {
          padding: 20px;
          text-align: center;
          color: #6b7280;
        }

        .recipe-placeholder {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
        }

        .recipe-display {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .recipe-display-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .recipe-display-header h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }

        .recipe-display-content {
          flex: 1;
          font-size: 16px;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        .recipe-editor {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recipe-title-input {
          font-size: 20px;
          padding: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-weight: 600;
        }

        .recipe-content-input {
          flex: 1;
          padding: 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          font-size: 16px;
          line-height: 1.5;
          resize: none;
          font-family: inherit;
        }

        .recipe-actions {
          display: flex;
          gap: 8px;
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

        button:hover {
          background: #f3f4f6;
        }

        button.primary {
          background: #111827;
          color: white;
          border-color: #111827;
        }

        button.primary:hover {
          background: #000;
        }

        button.small {
          padding: 6px 12px;
          font-size: 14px;
        }

        button.danger {
          background: #fef2f2;
          border-color: #ef4444;
          color: #991b1b;
        }

        button.danger:hover {
          background: #fee2e2;
        }

        @media (prefers-color-scheme: dark) {
          .recipe-manager {
            background: #111214;
            border-color: #26272b;
          }

          .recipe-sidebar {
            border-color: #26272b;
          }

          .recipe-header {
            border-color: #26272b;
          }

          .recipe-error {
            background: #2b1617;
            color: #fecaca;
          }

          .recipe-item {
            border-color: #1a1b1e;
          }

          .recipe-item:hover {
            background: #1a1b1e;
          }

          .recipe-item.selected {
            background: #1e293b;
            border-left-color: #60a5fa;
          }

          .recipe-empty,
          .recipe-placeholder {
            color: #9ca3af;
          }

          .recipe-display-header h3 {
            color: #e5e7eb;
          }

          .recipe-display-content {
            color: #e5e7eb;
          }

          .recipe-title-input,
          .recipe-content-input {
            background: #0b0b0c;
            border-color: #26272b;
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

          button.primary {
            background: #e5e7eb;
            color: #111827;
            border-color: #e5e7eb;
          }

          button.primary:hover {
            background: #fff;
          }

          button.danger {
            background: #2b1617;
            border-color: #ef4444;
            color: #fecaca;
          }
        }
      `}</style>
    </div>
  );
}