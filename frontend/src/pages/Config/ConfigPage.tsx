import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useConfig } from '@/contexts/ConfigContext';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '@/services/api';
import { toast } from 'react-hot-toast';

interface ConfigForm {
  chapter_enabled: boolean;
  retro_enabled: boolean;
}

export function ConfigPage() {
  const { config, refetchConfig } = useConfig();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<ConfigForm>({
    chapter_enabled: true,
    retro_enabled: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redireciona se não for admin
  useEffect(() => {
    if (user && !user.is_staff) {
      toast.error('Acesso negado. Apenas administradores.');
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Carrega dados da configuração
  useEffect(() => {
    if (config) {
      setFormData({
        chapter_enabled: config.chapter_enabled,
        retro_enabled: config.retro_enabled,
      });
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: pelo menos um módulo deve estar habilitado
    if (!formData.chapter_enabled && !formData.retro_enabled) {
      toast.error('Pelo menos um módulo deve estar habilitado');
      return;
    }

    setIsSubmitting(true);

    try {
      await api.patch('/auth/config/update/', formData);
      toast.success('Configuração atualizada com sucesso');
      await refetchConfig();
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error(
        error.response?.data?.detail || 
        'Erro ao atualizar configuração'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (field: keyof ConfigForm) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  if (!user?.is_staff) {
    return null; // Não renderiza nada para não-admins
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Configuração do Sistema
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie os módulos habilitados no sistema. Pelo menos um módulo deve estar ativo.
            </p>
          </div>

          {/* Informações da última atualização */}
          {config && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Última atualização:</strong>{' '}
                {new Date(config.updated_at).toLocaleString('pt-BR')}
                {config.updated_by_username && (
                  <span> por <strong>{config.updated_by_username}</strong></span>
                )}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Chapter Toggle */}
            <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  Módulo Chapter
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Gerenciamento de temas, apresentações, calendário e timeline.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('chapter_enabled')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                  ${formData.chapter_enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${formData.chapter_enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Retro Toggle */}
            <div className="flex items-start justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Módulo Retro
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Sistema de retrospectivas com templates, métricas e análise histórica.
                </p>
                <div className="mt-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-xs rounded-full inline-block">
                  Em desenvolvimento
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('retro_enabled')}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
                  transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2
                  ${formData.retro_enabled ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'}
                `}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
                    transition duration-200 ease-in-out
                    ${formData.retro_enabled ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>
            </div>

            {/* Warning se tentar desabilitar todos */}
            {!formData.chapter_enabled && !formData.retro_enabled && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">
                      Atenção: Pelo menos um módulo deve estar habilitado
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Habilite Chapter ou Retro antes de salvar as alterações.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || (!formData.chapter_enabled && !formData.retro_enabled)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
