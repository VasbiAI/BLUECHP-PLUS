import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; 

// Type definitions
type EntityCategory = {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
};

type Entity = {
  id: number;
  name: string;
  categoryId: number;
  description: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdAt: Date;
};

export function EntityManager() {
  const [activeTab, setActiveTab] = useState('categories');
  
  // Category state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteCategoryConfirmOpen, setIsDeleteCategoryConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EntityCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
  });
  
  // Entity state
  const [isAddEntityOpen, setIsAddEntityOpen] = useState(false);
  const [isEditEntityOpen, setIsEditEntityOpen] = useState(false);
  const [isDeleteEntityConfirmOpen, setIsDeleteEntityConfirmOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityForm, setEntityForm] = useState({
    name: '',
    categoryId: 0,
    description: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
  });
  
  const queryClient = useQueryClient();

  // Query to fetch categories
  const categoriesQuery = useQuery({
    queryKey: ['/api/entity-categories'],
    queryFn: async () => {
      const response = await fetch('/api/entity-categories');
      if (!response.ok) {
        throw new Error('Failed to fetch entity categories');
      }
      return response.json();
    }
  });

  // Query to fetch entities
  const entitiesQuery = useQuery({
    queryKey: ['/api/entities'],
    queryFn: async () => {
      const response = await fetch('/api/entities');
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      return response.json();
    }
  });

  // CATEGORY MUTATIONS
  
  // Create category mutation
  const createCategoryMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => {
      return apiRequest('/api/entity-categories', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entity-categories'] });
      setIsAddCategoryOpen(false);
      resetCategoryForm();
      toast({
        title: 'Success',
        description: 'Category created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: (data: { id: number; name: string; description: string }) => {
      return apiRequest(`/api/entity-categories/${data.id}`, 'PUT', {
        name: data.name,
        description: data.description
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entity-categories'] });
      setIsEditCategoryOpen(false);
      resetCategoryForm();
      toast({
        title: 'Success',
        description: 'Category updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/entity-categories/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entity-categories'] });
      setIsDeleteCategoryConfirmOpen(false);
      setSelectedCategory(null);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete category. Make sure it has no associated entities.',
        variant: 'destructive',
      });
    }
  });

  // ENTITY MUTATIONS
  
  // Create entity mutation
  const createEntityMutation = useMutation({
    mutationFn: (data: { 
      name: string; 
      categoryId: number;
      description: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
    }) => {
      return apiRequest('/api/entities', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
      setIsAddEntityOpen(false);
      resetEntityForm();
      toast({
        title: 'Success',
        description: 'Entity created successfully',
      });
    },
    onError: (error) => {
      console.error('Error creating entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to create entity',
        variant: 'destructive',
      });
    }
  });

  // Update entity mutation
  const updateEntityMutation = useMutation({
    mutationFn: (data: { 
      id: number; 
      name: string; 
      categoryId: number;
      description: string;
      contactName: string;
      contactEmail: string;
      contactPhone: string;
      address: string;
    }) => {
      return apiRequest(`/api/entities/${data.id}`, 'PUT', {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description,
        contactName: data.contactName,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
      setIsEditEntityOpen(false);
      resetEntityForm();
      toast({
        title: 'Success',
        description: 'Entity updated successfully',
      });
    },
    onError: (error) => {
      console.error('Error updating entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to update entity',
        variant: 'destructive',
      });
    }
  });

  // Delete entity mutation
  const deleteEntityMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/entities/${id}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/entities'] });
      setIsDeleteEntityConfirmOpen(false);
      setSelectedEntity(null);
      toast({
        title: 'Success',
        description: 'Entity deleted successfully',
      });
    },
    onError: (error) => {
      console.error('Error deleting entity:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entity',
        variant: 'destructive',
      });
    }
  });

  // Reset form helpers
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
    });
  };

  const resetEntityForm = () => {
    setEntityForm({
      name: '',
      categoryId: 0,
      description: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
    });
  };

  // Handle category events
  const handleEditCategory = (category: EntityCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    });
    setIsEditCategoryOpen(true);
  };

  const handleDeleteCategory = (category: EntityCategory) => {
    setSelectedCategory(category);
    setIsDeleteCategoryConfirmOpen(true);
  };

  // Handle entity events
  const handleEditEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    setEntityForm({
      name: entity.name,
      categoryId: entity.categoryId,
      description: entity.description || '',
      contactName: entity.contactName || '',
      contactEmail: entity.contactEmail || '',
      contactPhone: entity.contactPhone || '',
      address: entity.address || '',
    });
    setIsEditEntityOpen(true);
  };

  const handleDeleteEntity = (entity: Entity) => {
    setSelectedEntity(entity);
    setIsDeleteEntityConfirmOpen(true);
  };

  // Get category name by ID
  const getCategoryNameById = (id: number) => {
    if (categoriesQuery.isLoading || !categoriesQuery.data) return 'Loading...';
    const category = categoriesQuery.data.find((cat: EntityCategory) => cat.id === id);
    return category ? category.name : 'Unknown';
  };

  return (
    <div className="container mx-auto py-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="entities">Entities</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entity Categories</CardTitle>
              <Button onClick={() => setIsAddCategoryOpen(true)}>Add Category</Button>
            </CardHeader>
            <CardContent>
              {categoriesQuery.isLoading ? (
                <div className="flex justify-center py-8">Loading categories...</div>
              ) : categoriesQuery.isError ? (
                <div className="flex justify-center py-8 text-red-500">Error loading categories</div>
              ) : (
                <Table>
                  <TableCaption>List of entity categories in the system</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoriesQuery.data && categoriesQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center">No categories found</TableCell>
                      </TableRow>
                    ) : (
                      categoriesQuery.data && categoriesQuery.data.map((category: EntityCategory) => (
                        <TableRow key={category.id}>
                          <TableCell className="font-medium">{category.name}</TableCell>
                          <TableCell>{category.description || 'No description'}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" className="mr-2" onClick={() => handleEditCategory(category)}>
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteCategory(category)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="entities" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Entities</CardTitle>
              <Button 
                onClick={() => setIsAddEntityOpen(true)}
                disabled={!categoriesQuery.data || categoriesQuery.data.length === 0}
              >
                Add Entity
              </Button>
            </CardHeader>
            <CardContent>
              {entitiesQuery.isLoading ? (
                <div className="flex justify-center py-8">Loading entities...</div>
              ) : entitiesQuery.isError ? (
                <div className="flex justify-center py-8 text-red-500">Error loading entities</div>
              ) : (
                <Table>
                  <TableCaption>List of entities in the system</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entitiesQuery.data && entitiesQuery.data.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">No entities found</TableCell>
                      </TableRow>
                    ) : (
                      entitiesQuery.data && entitiesQuery.data.map((entity: Entity) => (
                        <TableRow key={entity.id}>
                          <TableCell className="font-medium">{entity.name}</TableCell>
                          <TableCell>{getCategoryNameById(entity.categoryId)}</TableCell>
                          <TableCell>{entity.contactName || 'N/A'}</TableCell>
                          <TableCell>
                            {entity.contactEmail && <div>{entity.contactEmail}</div>}
                            {entity.contactPhone && <div>{entity.contactPhone}</div>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" className="mr-2" onClick={() => handleEditEntity(entity)}>
                              Edit
                            </Button>
                            <Button variant="destructive" onClick={() => handleDeleteEntity(entity)}>
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Category Dialog */}
      <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>
              Create a new entity category
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createCategoryMutation.mutate({
                name: categoryForm.name,
                description: categoryForm.description
              })}
              disabled={!categoryForm.name || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={setIsEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update entity category details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditCategoryOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedCategory) {
                  updateCategoryMutation.mutate({
                    id: selectedCategory.id,
                    name: categoryForm.name,
                    description: categoryForm.description
                  });
                }
              }}
              disabled={!categoryForm.name || updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={isDeleteCategoryConfirmOpen} onOpenChange={setIsDeleteCategoryConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category "{selectedCategory?.name}"?
              This action cannot be undone. All entities in this category must be moved or deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedCategory) {
                  deleteCategoryMutation.mutate(selectedCategory.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? 'Deleting...' : 'Delete Category'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Entity Dialog */}
      <Dialog open={isAddEntityOpen} onOpenChange={setIsAddEntityOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Entity</DialogTitle>
            <DialogDescription>
              Create a new entity
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-name" className="text-right">
                Name
              </Label>
              <Input
                id="entity-name"
                value={entityForm.name}
                onChange={(e) => setEntityForm({...entityForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-category" className="text-right">
                Category
              </Label>
              <select
                id="entity-category"
                value={entityForm.categoryId}
                onChange={(e) => setEntityForm({...entityForm, categoryId: parseInt(e.target.value)})}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value={0} disabled>Select a category</option>
                {!categoriesQuery.isLoading && categoriesQuery.data && categoriesQuery.data.map((category: EntityCategory) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="entity-description"
                value={entityForm.description}
                onChange={(e) => setEntityForm({...entityForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-contact-name" className="text-right">
                Contact Name
              </Label>
              <Input
                id="entity-contact-name"
                value={entityForm.contactName}
                onChange={(e) => setEntityForm({...entityForm, contactName: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-contact-email" className="text-right">
                Contact Email
              </Label>
              <Input
                id="entity-contact-email"
                type="email"
                value={entityForm.contactEmail}
                onChange={(e) => setEntityForm({...entityForm, contactEmail: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-contact-phone" className="text-right">
                Contact Phone
              </Label>
              <Input
                id="entity-contact-phone"
                value={entityForm.contactPhone}
                onChange={(e) => setEntityForm({...entityForm, contactPhone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="entity-address" className="text-right">
                Address
              </Label>
              <Textarea
                id="entity-address"
                value={entityForm.address}
                onChange={(e) => setEntityForm({...entityForm, address: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEntityOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => createEntityMutation.mutate({
                name: entityForm.name,
                categoryId: entityForm.categoryId,
                description: entityForm.description,
                contactName: entityForm.contactName,
                contactEmail: entityForm.contactEmail,
                contactPhone: entityForm.contactPhone,
                address: entityForm.address
              })}
              disabled={!entityForm.name || entityForm.categoryId === 0 || createEntityMutation.isPending}
            >
              {createEntityMutation.isPending ? 'Saving...' : 'Save Entity'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Entity Dialog */}
      <Dialog open={isEditEntityOpen} onOpenChange={setIsEditEntityOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Entity</DialogTitle>
            <DialogDescription>
              Update entity details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-entity-name"
                value={entityForm.name}
                onChange={(e) => setEntityForm({...entityForm, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-category" className="text-right">
                Category
              </Label>
              <select
                id="edit-entity-category"
                value={entityForm.categoryId}
                onChange={(e) => setEntityForm({...entityForm, categoryId: parseInt(e.target.value)})}
                className="col-span-3 flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                {!categoriesQuery.isLoading && categoriesQuery.data && categoriesQuery.data.map((category: EntityCategory) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-entity-description"
                value={entityForm.description}
                onChange={(e) => setEntityForm({...entityForm, description: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-contact-name" className="text-right">
                Contact Name
              </Label>
              <Input
                id="edit-entity-contact-name"
                value={entityForm.contactName}
                onChange={(e) => setEntityForm({...entityForm, contactName: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-contact-email" className="text-right">
                Contact Email
              </Label>
              <Input
                id="edit-entity-contact-email"
                type="email"
                value={entityForm.contactEmail}
                onChange={(e) => setEntityForm({...entityForm, contactEmail: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-contact-phone" className="text-right">
                Contact Phone
              </Label>
              <Input
                id="edit-entity-contact-phone"
                value={entityForm.contactPhone}
                onChange={(e) => setEntityForm({...entityForm, contactPhone: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-entity-address" className="text-right">
                Address
              </Label>
              <Textarea
                id="edit-entity-address"
                value={entityForm.address}
                onChange={(e) => setEntityForm({...entityForm, address: e.target.value})}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditEntityOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (selectedEntity) {
                  updateEntityMutation.mutate({
                    id: selectedEntity.id,
                    name: entityForm.name,
                    categoryId: entityForm.categoryId,
                    description: entityForm.description,
                    contactName: entityForm.contactName,
                    contactEmail: entityForm.contactEmail,
                    contactPhone: entityForm.contactPhone,
                    address: entityForm.address
                  });
                }
              }}
              disabled={!entityForm.name || entityForm.categoryId === 0 || updateEntityMutation.isPending}
            >
              {updateEntityMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entity Confirmation */}
      <AlertDialog open={isDeleteEntityConfirmOpen} onOpenChange={setIsDeleteEntityConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the entity "{selectedEntity?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedEntity) {
                  deleteEntityMutation.mutate(selectedEntity.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEntityMutation.isPending}
            >
              {deleteEntityMutation.isPending ? 'Deleting...' : 'Delete Entity'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}