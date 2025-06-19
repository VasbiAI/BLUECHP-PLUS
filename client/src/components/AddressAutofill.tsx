import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript, Libraries } from '@react-google-maps/api';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// The libraries we need to load
const libraries: Libraries = ["places"];

// Address interface matching our database schema
interface Address {
  address: string;        // Full formatted address
  street: string;         // Street number and name
  city: string;           // City/Suburb
  state: string;          // State/Territory
  postalCode: string;     // Postal code
  country: string;        // Country
  latitude: string;       // Latitude
  longitude: string;      // Longitude
}

interface AddressAutofillProps {
  form: any;
  disabled?: boolean;
}

const AddressAutofill: React.FC<AddressAutofillProps> = ({ form, disabled = false }) => {
  const [searchValue, setSearchValue] = useState('');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load the Google Maps script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_REACT_APP_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  // Set up autocomplete when the script is loaded and the input is rendered
  useEffect(() => {
    if (isLoaded && inputRef.current && !autocompleteRef.current) {
      const options = {
        componentRestrictions: { country: 'au' },
        fields: ['address_components', 'formatted_address', 'geometry'],
        types: ['address'],
      };

      autocompleteRef.current = new google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      // Add a listener for when a place is selected
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place && place.address_components) {
          const address: Address = {
            address: place.formatted_address || '',
            street: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'Australia',
            latitude: place.geometry?.location?.lat().toString() || '',
            longitude: place.geometry?.location?.lng().toString() || '',
          };

          // Extract address components
          place.address_components.forEach(component => {
            const types = component.types;

            if (types.includes('street_number') || types.includes('route')) {
              // Build the street address from components
              if (types.includes('street_number')) {
                address.street = component.long_name + ' ' + (address.street || '');
              } else if (types.includes('route')) {
                address.street = (address.street || '') + component.long_name;
              }
            }

            if (types.includes('locality') || types.includes('sublocality')) {
              address.city = component.long_name;
            }

            if (types.includes('administrative_area_level_1')) {
              address.state = component.short_name;
            }

            if (types.includes('postal_code')) {
              address.postalCode = component.long_name;
            }

            if (types.includes('country')) {
              address.country = component.long_name;
            }
          });

          // Set all form values using form methods
          form.setValue('address', address.address);
          form.setValue('street', address.street.trim());
          form.setValue('city', address.city);
          form.setValue('state', address.state);
          form.setValue('postalCode', address.postalCode);
          form.setValue('country', address.country);
          form.setValue('latitude', address.latitude);
          form.setValue('longitude', address.longitude);
          
          // Update the search value to show the full address
          setSearchValue(address.address);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, form]);

  if (loadError) {
    return <div className="text-red-500">Error loading Google Maps: {loadError.message}</div>;
  }

  return (
    <div className="w-full space-y-2">
      <FormLabel>Address</FormLabel>
      <Input
        ref={inputRef}
        className="w-full"
        placeholder="Start typing an address..."
        value={searchValue}
        onChange={(e) => setSearchValue(e.target.value)}
        disabled={!isLoaded || disabled}
      />
      {!isLoaded && <div className="text-sm text-muted-foreground">Loading Google Maps...</div>}
      
      {/* Hidden fields that will be submitted with the form */}
      <div className="hidden">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="street"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="state" 
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="country"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => <Input {...field} />}
        />
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => <Input {...field} />}
        />
      </div>
    </div>
  );
};

export default AddressAutofill;