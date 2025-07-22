import { useState, useEffect } from 'react';
import PersonList from './PersonList';
import PersonForm from './PersonForm';
import ProjectManager from './ProjectManager';
import { peopleApi, ApiError } from '../services/api';
import type { Person, PersonCreate, PersonUpdate } from '../types/person';

type View = 'people' | 'create' | 'edit' | 'admin';

export default function PeopleManager() {
  const [people, setPeople] = useState<Person[]>([]);
  const [currentView, setCurrentView] = useState<View>('people');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentView === 'people') {
      loadPeople();
    }
  }, [currentView]);

  const loadPeople = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await peopleApi.getAllPeople();
      setPeople(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al cargar personas: ${err.message}`);
      } else {
        setError('Error desconocido al cargar personas');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePerson = async (personData: PersonCreate) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const newPerson = await peopleApi.createPerson(personData);
      setPeople(prev => [...prev, newPerson]);
      setCurrentView('people');
      setSuccess('Persona creada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al crear persona: ${err.message}`);
      } else {
        setError('Error desconocido al crear persona');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePerson = async (personData: PersonUpdate) => {
    if (!selectedPerson) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const updatedPerson = await peopleApi.updatePerson(selectedPerson.id, personData);
      setPeople(prev => prev.map(p => p.id === selectedPerson.id ? updatedPerson : p));
      setCurrentView('people');
      setSelectedPerson(null);
      setSuccess('Persona actualizada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al actualizar persona: ${err.message}`);
      } else {
        setError('Error desconocido al actualizar persona');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePerson = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta persona?')) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await peopleApi.deletePerson(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      setSuccess('Persona eliminada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Error al eliminar persona: ${err.message}`);
      } else {
        setError('Error desconocido al eliminar persona');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPerson = (person: Person) => {
    setSelectedPerson(person);
    setCurrentView('edit');
  };

  const handleCancel = () => {
    setCurrentView('people');
    setSelectedPerson(null);
    setError(null);
  };

  // If admin view is selected, show the ProjectManager
  if (currentView === 'admin') {
    return <ProjectManager />;
  }

  return (
    <div className="people-manager">
      <div className="container">
        {/* Page Header */}
        <div className="page-header">
          <h1>Registro Global de Personas</h1>
          <p>Sistema global de registro - AWS User Group Cochabamba</p>
        </div>

        {/* Main Navigation */}
        <div className="main-nav">
          <button
            onClick={() => setCurrentView('people')}
            className={`nav-btn ${currentView === 'people' ? 'active' : ''}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Personas
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`nav-btn ${currentView === 'admin' ? 'active' : ''}`}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Administración
          </button>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="alert alert-error">
            <div className="alert-content">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="alert-close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <div className="alert-content">
              <svg className="alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess(null)} className="alert-close">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'people' && (
          <div className="list-view">
            <div className="view-header">
              <div className="view-title">
                <h2>Personas Registradas</h2>
                <span className="person-count">{people.length} persona{people.length !== 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => setCurrentView('create')}
                className="btn btn-primary"
                disabled={isLoading}
              >
                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Registrar Nueva Persona
              </button>
            </div>
            
            <PersonList
              people={people}
              onEdit={handleEditPerson}
              onDelete={handleDeletePerson}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'create' && (
          <div className="form-view">
            <div className="view-header">
              <h2>Registrar Nueva Persona</h2>
            </div>
            <PersonForm
              onSubmit={handleCreatePerson}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentView === 'edit' && selectedPerson && (
          <div className="form-view">
            <div className="view-header">
              <h2>Editar Persona</h2>
            </div>
            <PersonForm
              person={selectedPerson}
              onSubmit={handleUpdatePerson}
              onCancel={handleCancel}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      <style jsx>{`
        .people-manager {
          min-height: 100vh;
        }

        .page-header {
          background: linear-gradient(135deg, #161d2b 0%, #4A90E2 100%);
          color: white;
          padding: 60px 0;
          text-align: center;
          margin-bottom: 40px;
          border-radius: 0 0 20px 20px;
        }

        .page-header h1 {
          font-size: 2.5rem;
          margin-bottom: 15px;
          font-weight: 700;
        }

        .page-header p {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }

        .main-nav {
          display: flex;
          gap: 10px;
          margin-bottom: 30px;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          background: transparent;
          color: #666;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .nav-btn:hover {
          background-color: #f8f9fa;
          color: #161d2b;
        }

        .nav-btn.active {
          background-color: #FF9900;
          color: #161d2b;
        }

        .alert {
          padding: 16px 20px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .alert-error {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .alert-success {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        .alert-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon {
          width: 20px;
          height: 20px;
          flex-shrink: 0;
        }

        .alert-close {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .alert-close:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        .alert-close svg {
          width: 16px;
          height: 16px;
        }

        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }

        .view-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .view-title h2 {
          font-size: 1.8rem;
          color: #161d2b;
          margin: 0;
        }

        .person-count {
          background-color: #4A90E2;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #FF9900;
          color: #161d2b;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .btn:hover:not(:disabled) {
          background-color: #e68a00;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .form-view {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .list-view {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .page-header {
            padding: 40px 0;
          }

          .page-header h1 {
            font-size: 2rem;
          }

          .page-header p {
            font-size: 1rem;
          }

          .main-nav {
            flex-direction: column;
            gap: 5px;
          }

          .nav-btn {
            justify-content: center;
          }

          .view-header {
            flex-direction: column;
            gap: 20px;
            align-items: flex-start;
          }

          .view-title {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
