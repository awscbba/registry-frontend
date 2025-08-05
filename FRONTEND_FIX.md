# Quick Fix for "Add New Person" Button

## Issue
The "Agregar Persona" button exists but might not be visible due to styling issues.

## Quick Fix
Replace the button in `src/components/AdminDashboard.tsx` around line 420-429:

### BEFORE:
```tsx
<button 
  onClick={() => setCurrentView('create-person')}
  className={BUTTON_CLASSES.CREATE}
  title="Crear nueva persona"
>
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Agregar Persona
</button>
```

### AFTER (with inline styles):
```tsx
<button 
  onClick={() => setCurrentView('create-person')}
  title="Crear nueva persona"
  style={{
    background: 'linear-gradient(135deg, #FF9900 0%, #E88B00 100%)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem'
  }}
>
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Agregar Persona
</button>
```

## Alternative: Use Tailwind Classes
```tsx
<button 
  onClick={() => setCurrentView('create-person')}
  title="Crear nueva persona"
  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
>
  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
  Agregar Persona
</button>
```

## Testing
1. Navigate to Admin Dashboard
2. Click on the People stats card (blue card showing total people)
3. Look for the orange "Agregar Persona" button in the top-right
4. Click it to open the person creation form
