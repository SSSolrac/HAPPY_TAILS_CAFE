import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Image, StatusChip } from '@/components/ui';
import { getErrorMessage } from '@/lib/errors';
import { useMenuCategories } from '@/hooks/useMenuCategories';
import { useMenuItems } from '@/hooks/useMenuItems';
import { useIngredients } from '@/hooks/useIngredients';
import { ingredientService } from '@/services/ingredientService';
import { menuService } from '@/services/menuService';
import type { Ingredient, RecipeLine } from '@/types/ingredient';
import type { MenuCategory, MenuItem } from '@/types/menuItem';
import { formatCurrency } from '@/utils/currency';

const createDefaultMenuItemDraft = (): MenuItem => ({
  id: '',
  code: '',
  name: '',
  categoryId: '',
  description: null,
  price: 0,
  discount: 0,
  isAvailable: true,
  imageUrl: null,
  createdAt: '',
  updatedAt: '',
});

const createIngredientDraft = (): Ingredient => ({
  id: '',
  code: '',
  name: '',
  unit: 'pcs',
  stockOnHand: 0,
  reorderLevel: 0,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

const defaultCategoryDraft: MenuCategory = { id: '', name: '', sortOrder: 0, isActive: true };

const asTrimmed = (value: string | null | undefined) => String(value || '').trim();

const hasValidImageUrl = (value: string | null | undefined) => {
  const text = asTrimmed(value);
  if (!text) return true;
  if (text.startsWith('data:image/')) return true;
  try {
    const parsed = new URL(text);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const validateMenuItemDraft = (draft: MenuItem) => {
  if (!asTrimmed(draft.name)) return 'Menu item name is required.';
  if (!asTrimmed(draft.categoryId)) return 'Category is required.';
  if (!Number.isFinite(draft.price) || draft.price < 0) return 'Price must be zero or higher.';
  if (!Number.isFinite(draft.discount) || draft.discount < 0) return 'Discount must be zero or higher.';
  if (draft.price > 0 && draft.discount > draft.price) return 'Discount cannot be greater than price.';
  if (!hasValidImageUrl(draft.imageUrl)) return 'Image URL must be http(s) or a valid image data URL.';
  return '';
};

export const MenuManagementPage = () => {
  const { categories, loading: categoriesLoading, error: categoriesError, saveCategory, deleteCategory } = useMenuCategories();
  const { items, loading: itemsLoading, error: itemsError, saveItem, deleteItem } = useMenuItems();
  const { ingredients, loading: ingredientsLoading, error: ingredientsError, saveIngredient, deleteIngredient } = useIngredients();
  const [categoryDraft, setCategoryDraft] = useState<MenuCategory>(defaultCategoryDraft);
  const [draft, setDraft] = useState<MenuItem>(() => createDefaultMenuItemDraft());
  const [ingDraft, setIngDraft] = useState<Ingredient>(() => createIngredientDraft());
  const [recipeDraft, setRecipeDraft] = useState<RecipeLine>({ id: '', menuItemId: '', ingredientId: '', quantityRequired: 1 });
  const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([]);
  const [query, setQuery] = useState('');
  const [menuItemError, setMenuItemError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const filtered = useMemo(
    () => items.filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  );
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);

  useEffect(() => {
    ingredientService
      .listRecipeLines(recipeDraft.menuItemId || undefined)
      .then(setRecipeLines)
      .catch(() => setRecipeLines([]));
  }, [recipeDraft.menuItemId]);

  if (itemsLoading) return <p>Loading menu...</p>;
  if (itemsError) return <p className="text-red-600">{itemsError}</p>;

  const resetMenuItemDraft = () => {
    setDraft(createDefaultMenuItemDraft());
    setMenuItemError('');
  };

  const handleSaveMenuItem = async () => {
    const validationError = validateMenuItemDraft(draft);
    if (validationError) {
      setMenuItemError(validationError);
      toast.error(validationError);
      return;
    }

    try {
      setMenuItemError('');
      const saved = await saveItem({
        ...draft,
        name: asTrimmed(draft.name),
        categoryId: asTrimmed(draft.categoryId),
        description: asTrimmed(draft.description) || null,
        imageUrl: asTrimmed(draft.imageUrl) || null,
      });
      toast.success(`${draft.id ? 'Menu item updated' : 'Menu item created'} (${saved.code}).`);
      resetMenuItemDraft();
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to save menu item.');
      setMenuItemError(message);
      toast.error(message);
    }
  };

  const handleMenuImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await menuService.uploadMenuItemImage(file);
      setDraft((current) => ({ ...current, imageUrl: uploadedUrl }));
      setMenuItemError('');
      toast.success('Menu image uploaded.');
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to upload image.');
      setMenuItemError(message);
      toast.error(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSaveCategory = async () => {
    const name = asTrimmed(categoryDraft.name);
    if (!name) {
      toast.error('Category name is required.');
      return;
    }

    try {
      const saved = await saveCategory({ ...categoryDraft, name });
      setCategoryDraft(defaultCategoryDraft);
      toast.success(`Category saved (${saved.name}).`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save category.'));
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast.info('Category removed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove category.'));
    }
  };

  const handleDeleteMenuItem = async (itemId: string) => {
    try {
      await deleteItem(itemId);
      toast.info('Menu item removed.');
      if (draft.id === itemId) resetMenuItemDraft();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove menu item.'));
    }
  };

  const handleSaveIngredient = async () => {
    const name = asTrimmed(ingDraft.name);
    if (!name) {
      toast.error('Ingredient name is required.');
      return;
    }

    try {
      const saved = await saveIngredient({ ...ingDraft, name });
      setIngDraft(createIngredientDraft());
      toast.success(`Ingredient saved (${saved.code}).`);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save ingredient.'));
    }
  };

  const handleDeleteIngredient = async (ingredientId: string) => {
    try {
      await deleteIngredient(ingredientId);
      toast.info('Ingredient removed.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to remove ingredient.'));
    }
  };

  const handleSaveRecipeLine = async () => {
    if (!recipeDraft.menuItemId || !recipeDraft.ingredientId) {
      toast.error('Select both a menu item and ingredient first.');
      return;
    }
    if (!Number.isFinite(recipeDraft.quantityRequired) || recipeDraft.quantityRequired <= 0) {
      toast.error('Recipe quantity must be greater than zero.');
      return;
    }

    try {
      const saved = await ingredientService.saveRecipeLine(recipeDraft);
      setRecipeLines((rows) => [saved, ...rows]);
      toast.success('Recipe line saved.');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Unable to save recipe line.'));
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Manage Menu Items</h2>
        <p className="text-sm text-[#6B7280]">Add, edit, and validate menu items with optional image upload support.</p>
        {categoriesLoading ? <p className="text-sm text-[#6B7280]">Loading categories...</p> : null}
        {categoriesError ? <p className="text-sm text-red-600">{categoriesError}</p> : null}

        <h3 className="font-medium">Add New Menu Item</h3>
        {menuItemError ? <p className="text-sm text-red-600">{menuItemError}</p> : null}

        <div className="grid md:grid-cols-2 gap-3">
          <label className="text-sm">
            Code (optional)
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.code}
              onChange={(event) => setDraft({ ...draft, code: event.target.value })}
            />
          </label>
          <label className="text-sm">
            Item Name
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </label>
          <label className="text-sm">
            Category
            <select
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.categoryId}
              onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Price
            <input
              type="number"
              min={0}
              step="0.01"
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
            />
          </label>
          <label className="text-sm">
            Discount amount
            <input
              type="number"
              min={0}
              step="0.01"
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.discount}
              onChange={(event) => setDraft({ ...draft, discount: Number(event.target.value) })}
            />
          </label>
          <label className="text-sm">
            Availability
            <div className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.isAvailable}
                onChange={(event) => setDraft({ ...draft, isAvailable: event.target.checked })}
              />
              <span>{draft.isAvailable ? 'Available' : 'Unavailable'}</span>
            </div>
          </label>
          <label className="text-sm md:col-span-2">
            Description
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              value={draft.description ?? ''}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Image URL (optional)
            <input
              className="block border rounded mt-1 px-2 py-1 w-full"
              placeholder="https://..."
              value={draft.imageUrl ?? ''}
              onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">
            Upload image
            <input
              type="file"
              accept="image/*"
              className="block border rounded mt-1 px-2 py-1 w-full text-sm"
              onChange={handleMenuImageUpload}
              disabled={isUploadingImage}
            />
          </label>
          <p className="text-xs text-[#6B7280]">
            {isUploadingImage ? 'Uploading image...' : 'Uploads use Supabase Storage bucket "menu-images".'}
          </p>
          {draft.imageUrl ? <Image src={draft.imageUrl} alt={draft.name || 'menu image'} className="h-14 w-14 rounded object-cover border" /> : null}
        </div>

        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={handleSaveMenuItem}>
            {draft.id ? 'Update Menu Item' : 'Add New Menu Item'}
          </button>
          {draft.id ? (
            <button className="border rounded px-3 py-1" onClick={resetMenuItemDraft}>
              Cancel Edit
            </button>
          ) : null}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Manage Categories</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Category name"
            value={categoryDraft.name}
            onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })}
          />
          <input
            className="border rounded px-2 py-1"
            type="number"
            placeholder="Sort order"
            value={categoryDraft.sortOrder}
            onChange={(event) => setCategoryDraft({ ...categoryDraft, sortOrder: Number(event.target.value) })}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={categoryDraft.isActive}
              onChange={(event) => setCategoryDraft({ ...categoryDraft, isActive: event.target.checked })}
            />
            Active
          </label>
        </div>
        <div className="flex gap-2">
          <button className="border rounded px-3 py-1" onClick={handleSaveCategory}>
            Save Category
          </button>
          {categoryDraft.id ? (
            <button className="border rounded px-3 py-1" onClick={() => setCategoryDraft(defaultCategoryDraft)}>
              Cancel Edit
            </button>
          ) : null}
        </div>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="border rounded p-2 text-sm flex items-center justify-between">
              <p>
                {category.sortOrder} - {category.name} {category.isActive ? '' : '(inactive)'}
              </p>
              <div className="flex gap-2">
                <button className="border rounded px-2 py-1" onClick={() => setCategoryDraft(category)}>
                  Edit
                </button>
                <button className="border rounded px-2 py-1" onClick={() => handleDeleteCategory(category.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Manage Menu Items</h3>
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="Search code or name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="border rounded p-3 flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-3 min-w-[260px]">
                <Image src={item.imageUrl ?? undefined} alt={item.name} className="h-14 w-14 rounded object-cover" />
                <div>
                  <p className="font-medium">
                    {item.code} - {item.name} - {formatCurrency(item.price)}
                  </p>
                  <p className="text-[#6B7280]">
                    Category: {categoryById.get(item.categoryId) ?? (item.categoryId || 'uncategorized')} - Updated:{' '}
                    {new Date(item.updatedAt).toLocaleString()}
                  </p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    <StatusChip label={item.isAvailable ? 'Available' : 'Unavailable'} tone={item.isAvailable ? 'success' : 'warning'} />
                    <StatusChip
                      label={item.discount > 0 ? `${formatCurrency(item.discount)} off` : 'No discount'}
                      tone={item.discount > 0 ? 'warning' : 'neutral'}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <button className="border rounded px-2 py-1" onClick={() => setDraft(item)}>
                  Edit
                </button>
                <button className="border rounded px-2 py-1" onClick={() => handleDeleteMenuItem(item.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Ingredients Inventory</h3>
        {ingredientsLoading ? <p className="text-sm text-[#6B7280]">Loading ingredients...</p> : null}
        {ingredientsError ? <p className="text-sm text-red-600">{ingredientsError}</p> : null}
        <div className="grid md:grid-cols-4 gap-2">
          <input
            className="border rounded px-2 py-1"
            placeholder="Ingredient name"
            value={ingDraft.name}
            onChange={(event) => setIngDraft({ ...ingDraft, name: event.target.value })}
          />
          <select
            className="border rounded px-2 py-1"
            value={ingDraft.unit}
            onChange={(event) => setIngDraft({ ...ingDraft, unit: event.target.value as Ingredient['unit'] })}
          >
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="l">l</option>
            <option value="pcs">pcs</option>
          </select>
          <input
            className="border rounded px-2 py-1"
            type="number"
            placeholder="Stock"
            value={ingDraft.stockOnHand}
            onChange={(event) => setIngDraft({ ...ingDraft, stockOnHand: Number(event.target.value) })}
          />
          <input
            className="border rounded px-2 py-1"
            type="number"
            placeholder="Reorder level"
            value={ingDraft.reorderLevel}
            onChange={(event) => setIngDraft({ ...ingDraft, reorderLevel: Number(event.target.value) })}
          />
        </div>
        <button className="border rounded px-3 py-1" onClick={handleSaveIngredient}>
          Save Ingredient
        </button>
        <div className="space-y-2">
          {ingredients.map((ingredient) => (
            <div key={ingredient.id} className="border rounded p-2 text-sm flex items-center justify-between">
              <p>
                {ingredient.code} - {ingredient.name} ({ingredient.unit}) on hand {ingredient.stockOnHand}, reorder {ingredient.reorderLevel}
              </p>
              <button className="border rounded px-2 py-1" onClick={() => handleDeleteIngredient(ingredient.id)}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border bg-white dark:bg-slate-800 p-4 space-y-3">
        <h3 className="font-medium">Recipe Lines (Menu Item to Ingredient Usage)</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <select
            className="border rounded px-2 py-1"
            value={recipeDraft.menuItemId}
            onChange={(event) => setRecipeDraft({ ...recipeDraft, menuItemId: event.target.value })}
          >
            <option value="">Menu item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.code} - {item.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-2 py-1"
            value={recipeDraft.ingredientId}
            onChange={(event) => setRecipeDraft({ ...recipeDraft, ingredientId: event.target.value })}
          >
            <option value="">Ingredient</option>
            {ingredients.map((ingredient) => (
              <option key={ingredient.id} value={ingredient.id}>
                {ingredient.code} - {ingredient.name}
              </option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1"
            type="number"
            min={0.001}
            step="0.001"
            value={recipeDraft.quantityRequired}
            onChange={(event) => setRecipeDraft({ ...recipeDraft, quantityRequired: Number(event.target.value) })}
          />
        </div>
        <button className="border rounded px-3 py-1" onClick={handleSaveRecipeLine}>
          Save Recipe Line
        </button>
        <div className="space-y-2">
          {recipeLines.map((line) => (
            <p key={line.id} className="text-sm border rounded p-2">
              {line.menuItemId} uses {line.ingredientId} qty {line.quantityRequired}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
};
