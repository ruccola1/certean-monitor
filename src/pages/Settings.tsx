import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Save, Edit2, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';

interface ComplianceArea {
  id?: string;
  name: string;
  description: string;
  isDefault?: boolean;
}

export default function Settings() {
  const { user } = useAuth0();
  const [areas, setAreas] = useState<ComplianceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [editingArea, setEditingArea] = useState<ComplianceArea | null>(null);
  const [descriptionValue, setDescriptionValue] = useState('');

  useEffect(() => {
    fetchComplianceAreas();
  }, []);

  const fetchComplianceAreas = async () => {
    try {
      setLoading(true);
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Only fetch custom areas from client DB (user should not see defaults)
      // Extract client_id from Auth0 user token
      const clientId = getClientId(user); // Use Auth0 user.sub as client_id
      const customResponse = await apiService.get(`/api/compliance-areas/custom/${clientId}`);
      // Backend returns {"data": [...]}, so access response.data.data
      const customData = customResponse?.data?.data || customResponse?.data || [];
      
      // Only set custom areas (empty array if none exist)
      setAreas(Array.isArray(customData) ? customData : []);
    } catch (error) {
      console.error('Error fetching compliance areas:', error);
      // Fallback to empty array to prevent errors
      setAreas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmedValue = inputValue.trim();
      if (trimmedValue && !areas.some(area => area.name.toLowerCase() === trimmedValue.toLowerCase())) {
        const newArea: ComplianceArea = {
          name: trimmedValue,
          description: '',
          isDefault: false,
        };
        setAreas([...areas, newArea]);
        setInputValue('');
      }
    }
  };

  const handleInputBlur = () => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue && !areas.some(area => area.name.toLowerCase() === trimmedValue.toLowerCase())) {
      const newArea: ComplianceArea = {
        name: trimmedValue,
        description: '',
        isDefault: false,
      };
      setAreas([...areas, newArea]);
      setInputValue('');
    }
  };

  const removeArea = (name: string) => {
    setAreas(areas.filter(area => area.name !== name));
  };

  const startEditing = (area: ComplianceArea) => {
    setEditingArea(area);
    setDescriptionValue(area.description || '');
  };

  const saveDescription = (area: ComplianceArea) => {
    setAreas(areas.map(a => 
      a.name === area.name 
        ? { ...a, description: descriptionValue }
        : a
    ));
    setEditingArea(null);
    setDescriptionValue('');
  };

  const cancelEditing = () => {
    setEditingArea(null);
    setDescriptionValue('');
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
      if (apiKey) {
        apiService.setToken(apiKey);
      }

      // Extract client_id from Auth0 user token (use user.sub as client_id)
      const clientId = getClientId(user);
      
      console.log('Saving compliance areas for client_id:', clientId);
      console.log('Areas to save:', areas);
      
      // Ensure areas is an array
      const areasToSave = Array.isArray(areas) ? areas : [];
      
      // Save custom areas to client DB
      const response = await apiService.post(`/api/compliance-areas/custom/${clientId}`, {
        areas: areasToSave.map(area => ({
          name: area.name || '',
          description: area.description || '',
        })),
      });

      console.log('Save response:', response);
      alert(`Compliance areas saved successfully! Database: c_monitor_${clientId}, Collection: compliance_areas`);
    } catch (error: any) {
      console.error('Error saving compliance areas:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error';
      alert(`Failed to save compliance areas: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-view-background p-4 md:p-8">
        <div className="max-w-7xl space-y-4 md:space-y-8">
          <div>
            <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Settings</h1>
            <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-view-background p-4 md:p-8">
      <div className="max-w-7xl space-y-4 md:space-y-8">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Settings</h1>
          <p className="text-sm md:text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Manage your compliance monitoring preferences
          </p>
        </div>

        <Card className="bg-white border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Compliance Areas
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Define custom compliance categories to organize compliance elements. These categories will be used to filter and categorize compliance elements for your products.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Input for adding new areas */}
            <div className="space-y-2">
              <Label htmlFor="area-input" className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                Add Compliance Area
              </Label>
              <Input
                id="area-input"
                placeholder="Type area name and press Enter or comma (e.g., Electronics, Food, Packaging)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleInputKeyDown}
                onBlur={handleInputBlur}
                className="border-0 bg-dashboard-view-background text-[hsl(var(--dashboard-link-color))]"
              />
              <p className="text-xs text-gray-500">
                Type a category name and press Enter or comma to add it as a pill. Examples: Electronics, Food, Packaging, Chemicals, Mechanical
              </p>
            </div>

            {/* Display areas as pills */}
            {areas.length > 0 && (
              <div className="space-y-4">
                <Label className="text-sm font-medium text-[hsl(var(--dashboard-link-color))]">
                  Your Compliance Areas ({areas.length})
                </Label>
                <div className="space-y-3">
                  {areas.map((area, index) => (
                    <div key={index} className="bg-dashboard-view-background p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            variant="secondary" 
                            className="bg-[hsl(var(--dashboard-link-color))] text-white border-0"
                          >
                            {area.name}
                            {!area.isDefault && (
                              <button
                                onClick={() => removeArea(area.name)}
                                className="ml-2 hover:bg-black/20 rounded-full p-0.5"
                                title="Remove area"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        </div>
                        {!area.isDefault && (
                          <div className="flex items-center gap-2">
                            {editingArea?.name === area.name ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => saveDescription(area)}
                                  className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="border-0 bg-white text-gray-600 hover:bg-gray-100 text-xs"
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => startEditing(area)}
                                className="border-0 bg-white text-[hsl(var(--dashboard-link-color))] hover:bg-gray-100 text-xs"
                              >
                                <Edit2 className="w-3 h-3 mr-1" />
                                {area.description ? 'Edit' : 'Add'} Description
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {editingArea?.name === area.name ? (
                        <div className="space-y-2">
                          <textarea
                            value={descriptionValue}
                            onChange={(e) => setDescriptionValue(e.target.value)}
                            placeholder="Enter description for this compliance area..."
                            rows={3}
                            className="w-full border-0 bg-white text-[hsl(var(--dashboard-link-color))] p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--dashboard-link-color))]"
                          />
                        </div>
                      ) : (
                        area.description && (
                          <p className="text-xs text-gray-600 mt-2">{area.description}</p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {areas.length === 0 && (
              <div className="text-center py-8 text-sm text-gray-500">
                No compliance areas defined yet. Add your first area above to get started.
              </div>
            )}

            {/* Save button */}
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Compliance Areas
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

