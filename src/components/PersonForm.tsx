import React, { useState } from 'react';
import type { Person, PersonCreate, PersonUpdate } from '../types/person';
import ProjectSubscriptionManager from './ProjectSubscriptionManager';

interface PersonFormProps {
  person?: Person;
  onSubmit: (data: PersonCreate | PersonUpdate, subscriptionData?: { projectIds: string[] }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function PersonForm({ person, onSubmit, onCancel, isLoading = false }: PersonFormProps) {
  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    // If it's a datetime string, extract just the date part
    return dateString.split('T')[0];
  };

  const [formData, setFormData] = useState({
    firstName: person?.firstName || '',
    lastName: person?.lastName || '',
    email: person?.email || '',
    phone: person?.phone || '',
    dateOfBirth: formatDateForInput(person?.dateOfBirth),
    address: {
      street: person?.address?.street || '',
      city: person?.address?.city || '',
      state: person?.address?.state || '',
      country: person?.address?.country || '',
      postalCode: person?.address?.postalCode || '',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  // Global countries list (major countries)
  const countries = [
    'Afganistán', 'Albania', 'Alemania', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaiyán',
    'Bahamas', 'Bangladés', 'Barbados', 'Bélgica', 'Belice', 'Benín', 'Bielorrusia', 'Bolivia', 'Bosnia y Herzegovina', 'Botsuana', 'Brasil', 'Brunéi', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Camboya', 'Camerún', 'Canadá', 'Catar', 'Chad', 'Chile', 'China', 'Chipre', 'Colombia', 'Comoras', 'Congo', 'Corea del Norte', 'Corea del Sur', 'Costa Rica', 'Costa de Marfil', 'Croacia', 'Cuba',
    'Dinamarca', 'Dominica',
    'Ecuador', 'Egipto', 'El Salvador', 'Emiratos Árabes Unidos', 'Eritrea', 'Eslovaquia', 'Eslovenia', 'España', 'Estados Unidos', 'Estonia', 'Etiopía',
    'Filipinas', 'Finlandia', 'Fiyi', 'Francia',
    'Gabón', 'Gambia', 'Georgia', 'Ghana', 'Granada', 'Grecia', 'Guatemala', 'Guinea', 'Guinea-Bisáu', 'Guinea Ecuatorial', 'Guyana',
    'Haití', 'Honduras', 'Hungría',
    'India', 'Indonesia', 'Irak', 'Irán', 'Irlanda', 'Islandia', 'Israel', 'Italia',
    'Jamaica', 'Japón', 'Jordania',
    'Kazajistán', 'Kenia', 'Kirguistán', 'Kiribati', 'Kuwait',
    'Laos', 'Lesoto', 'Letonia', 'Líbano', 'Liberia', 'Libia', 'Liechtenstein', 'Lituania', 'Luxemburgo',
    'Madagascar', 'Malasia', 'Malaui', 'Maldivas', 'Malí', 'Malta', 'Marruecos', 'Mauricio', 'Mauritania', 'México', 'Micronesia', 'Moldavia', 'Mónaco', 'Mongolia', 'Montenegro', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Nicaragua', 'Níger', 'Nigeria', 'Noruega', 'Nueva Zelanda',
    'Omán',
    'Países Bajos', 'Pakistán', 'Palaos', 'Panamá', 'Papúa Nueva Guinea', 'Paraguay', 'Perú', 'Polonia', 'Portugal',
    'Reino Unido', 'República Centroafricana', 'República Checa', 'República Democrática del Congo', 'República Dominicana', 'Ruanda', 'Rumania', 'Rusia',
    'Samoa', 'San Cristóbal y Nieves', 'San Marino', 'San Vicente y las Granadinas', 'Santa Lucía', 'Santo Tomé y Príncipe', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leona', 'Singapur', 'Siria', 'Somalia', 'Sri Lanka', 'Suazilandia', 'Sudáfrica', 'Sudán', 'Sudán del Sur', 'Suecia', 'Suiza', 'Surinam',
    'Tailandia', 'Tanzania', 'Tayikistán', 'Timor Oriental', 'Togo', 'Tonga', 'Trinidad y Tobago', 'Túnez', 'Turkmenistán', 'Turquía', 'Tuvalu',
    'Ucrania', 'Uganda', 'Uruguay', 'Uzbekistán',
    'Vanuatu', 'Vaticano', 'Venezuela', 'Vietnam',
    'Yemen',
    'Yibuti',
    'Zambia', 'Zimbabue'
  ];

  // Common states/provinces for major countries (user can also type freely)
  const statesByCountry: Record<string, string[]> = {
    'Argentina': ['Buenos Aires', 'Córdoba', 'Santa Fe', 'Mendoza', 'Tucumán', 'Entre Ríos', 'Salta', 'Misiones', 'Chaco', 'Corrientes'],
    'Bolivia': ['La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'],
    'Brasil': ['São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Bahia', 'Paraná', 'Rio Grande do Sul', 'Pernambuco', 'Ceará', 'Pará', 'Santa Catarina'],
    'Chile': ['Santiago', 'Valparaíso', 'Biobío', 'Araucanía', 'Los Lagos', 'Maule', 'Antofagasta', 'Coquimbo', 'Tarapacá', 'Los Ríos'],
    'Colombia': ['Bogotá', 'Antioquia', 'Valle del Cauca', 'Atlántico', 'Santander', 'Bolívar', 'Cundinamarca', 'Norte de Santander', 'Córdoba', 'Tolima'],
    'Ecuador': ['Pichincha', 'Guayas', 'Azuay', 'Tungurahua', 'Manabí', 'El Oro', 'Los Ríos', 'Loja', 'Chimborazo', 'Cotopaxi'],
    'España': ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao'],
    'Estados Unidos': ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'],
    'México': ['Ciudad de México', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla', 'Guanajuato', 'Chihuahua', 'Veracruz', 'Michoacán', 'Oaxaca'],
    'Paraguay': ['Central', 'Alto Paraná', 'Itapúa', 'Caaguazú', 'San Pedro', 'Cordillera', 'Guairá', 'Caazapá', 'Paraguarí', 'Misiones'],
    'Perú': ['Lima', 'Arequipa', 'La Libertad', 'Piura', 'Lambayeque', 'Cusco', 'Junín', 'Puno', 'Ica', 'Ancash'],
    'Uruguay': ['Montevideo', 'Canelones', 'Maldonado', 'Salto', 'Paysandú', 'Rivera', 'Tacuarembó', 'Artigas', 'San José', 'Colonia'],
    'Venezuela': ['Distrito Capital', 'Miranda', 'Zulia', 'Carabobo', 'Lara', 'Aragua', 'Bolívar', 'Anzoátegui', 'Táchira', 'Falcón']
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Nombre es requerido';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Apellido es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email es requerido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Teléfono es requerido';
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Fecha de nacimiento es requerida';
    }
    if (!formData.address.street.trim()) {
      newErrors.street = 'Dirección es requerida';
    }
    if (!formData.address.city.trim()) {
      newErrors.city = 'Ciudad es requerida';
    }
    if (!formData.address.state.trim()) {
      newErrors.state = 'Departamento es requerido';
    }
    if (!formData.address.country.trim()) {
      newErrors.country = 'País es requerido';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Por favor ingrese un email válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Pass both person data and subscription data to parent
    await onSubmit(formData, { projectIds: selectedProjectIds });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="person-form">
      <form onSubmit={handleSubmit} className="form-container">
        {/* Personal Information Section */}
        <div className="form-section">
          <h3 className="section-title">Información Personal</h3>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                Nombre *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`form-control ${errors.firstName ? 'error' : ''}`}
                disabled={isLoading}
                placeholder="Ingrese su nombre"
              />
              {errors.firstName && <span className="error-message">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Apellido *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`form-control ${errors.lastName ? 'error' : ''}`}
                disabled={isLoading}
                placeholder="Ingrese su apellido"
              />
              {errors.lastName && <span className="error-message">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`form-control ${errors.email ? 'error' : ''}`}
                disabled={isLoading}
                placeholder="ejemplo@correo.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Teléfono *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+XX XXXXXXXX"
                className={`form-control ${errors.phone ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="dateOfBirth" className="form-label">
              Fecha de Nacimiento *
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleInputChange}
              className={`form-control ${errors.dateOfBirth ? 'error' : ''}`}
              disabled={isLoading}
            />
            {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
          </div>
        </div>

        {/* Address Section */}
        <div className="form-section">
          <h3 className="section-title">Dirección</h3>
          
          <div className="form-group">
            <label htmlFor="address.street" className="form-label">
              Dirección *
            </label>
            <input
              type="text"
              id="address.street"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              placeholder="Calle Principal #123"
              className={`form-control ${errors.street ? 'error' : ''}`}
              disabled={isLoading}
            />
            {errors.street && <span className="error-message">{errors.street}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.city" className="form-label">
                Ciudad *
              </label>
              <input
                type="text"
                id="address.city"
                name="address.city"
                value={formData.address.city}
                onChange={handleInputChange}
                placeholder="Ciudad"
                className={`form-control ${errors.city ? 'error' : ''}`}
                disabled={isLoading}
              />
              {errors.city && <span className="error-message">{errors.city}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address.state" className="form-label">
                Estado/Provincia/Departamento *
              </label>
              <input
                type="text"
                id="address.state"
                name="address.state"
                value={formData.address.state}
                onChange={handleInputChange}
                placeholder="Estado, Provincia o Departamento"
                className={`form-control ${errors.state ? 'error' : ''}`}
                disabled={isLoading}
                list="states-list"
              />
              <datalist id="states-list">
                {statesByCountry[formData.address.country]?.map(state => (
                  <option key={state} value={state} />
                ))}
              </datalist>
              {errors.state && <span className="error-message">{errors.state}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="address.country" className="form-label">
                País *
              </label>
              <select
                id="address.country"
                name="address.country"
                value={formData.address.country}
                onChange={handleInputChange}
                className={`form-control ${errors.country ? 'error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Seleccionar país</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && <span className="error-message">{errors.country}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address.postalCode" className="form-label">
                Código Postal <span className="optional">(opcional)</span>
              </label>
              <input
                type="text"
                id="address.postalCode"
                name="address.postalCode"
                value={formData.address.postalCode}
                onChange={handleInputChange}
                placeholder="0000"
                className="form-control"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Project Subscriptions Section */}
        <ProjectSubscriptionManager
          personId={person?.id}
          isEditing={true}
          onSubscriptionsChange={setSelectedProjectIds}
        />

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Guardando...' : person ? 'Actualizar Persona' : 'Crear Persona'}
          </button>
        </div>
      </form>

      <style jsx>{`
        .person-form {
          max-width: 800px;
          margin: 0 auto;
        }

        .form-container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .form-section {
          margin-bottom: 40px;
        }

        .form-section:last-of-type {
          margin-bottom: 30px;
        }

        .section-title {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--primary-color);
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--secondary-color);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text-color);
          font-size: 0.95rem;
        }

        .optional {
          font-weight: 400;
          color: #666;
          font-size: 0.85rem;
        }

        .form-control {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.3s ease;
          background-color: white;
        }

        .form-control:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
        }

        .form-control.error {
          border-color: var(--error-color);
        }

        .form-control:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .error-message {
          display: block;
          color: var(--error-color);
          font-size: 0.85rem;
          margin-top: 5px;
          font-weight: 500;
        }

        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding-top: 20px;
          border-top: 1px solid var(--border-color);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 140px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background-color: var(--secondary-color);
          color: var(--primary-color);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #e68a00;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .btn-secondary {
          background-color: #f8f9fa;
          color: var(--text-color);
          border: 2px solid var(--border-color);
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #e9ecef;
          border-color: #adb5bd;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 20px;
          }

          .form-row {
            grid-template-columns: 1fr;
            gap: 15px;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn {
            width: 100%;
          }

          .section-title {
            font-size: 1.2rem;
          }
        }
      `}</style>
    </div>
  );
}
