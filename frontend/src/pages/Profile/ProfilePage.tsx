import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  MainLayout,
  Avatar,
  StatsCard,
  IdeaCard,
  Loading,
  Button,
} from '@/components';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { toast } from 'sonner';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'created' | 'presenting'>('created');

  // Fetch user profile with stats
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authService.getProfile(),
  });

  // Fetch user stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => authService.getUserStats(),
  });

  const isLoading = profileLoading || statsLoading;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  const displayName = user
    ? user.first_name && user.last_name
      ? `${user.first_name} ${user.last_name}`
      : user.username
    : 'Usuário';

  const createdIdeas = profile?.ideias_criadas || [];
  const presentingIdeas = profile?.ideias_apresentando || [];

  return (
    <MainLayout>
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <Avatar user={user} size="xl" className="ring-4 ring-white/30" />

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
            {user?.email && (
              <p className="text-indigo-100 mb-4">{user.email}</p>
            )}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div>
                <div className="text-2xl font-bold">{stats?.ideias_criadas || 0}</div>
                <div className="text-sm text-indigo-200">Ideias criadas</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.apresentacoes || 0}</div>
                <div className="text-sm text-indigo-200">Apresentações</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.votos_dados || 0}</div>
                <div className="text-sm text-indigo-200">Votos dados</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.votos_recebidos || 0}</div>
                <div className="text-sm text-indigo-200">Votos recebidos</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/profile/edit')}
              variant="secondary"
              className="bg-white text-indigo-600 hover:bg-indigo-50"
            >
              Editar Perfil
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Ideias Pendentes"
          value={stats?.ideias_por_status?.pendentes || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          description="Aguardando votação"
        />

        <StatsCard
          title="Ideias Agendadas"
          value={stats?.ideias_por_status?.agendadas || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          description="Programadas"
        />

        <StatsCard
          title="Ideias Concluídas"
          value={stats?.ideias_por_status?.concluidas || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          description="Apresentações realizadas"
        />

        <StatsCard
          title="Apresentações Agendadas"
          value={stats?.apresentacoes_por_status?.agendadas || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          }
          description="Como apresentador"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6">
            <button
              onClick={() => setActiveTab('created')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'created'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Minhas Ideias ({createdIdeas.length})
            </button>
            <button
              onClick={() => setActiveTab('presenting')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'presenting'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Apresentando ({presentingIdeas.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'created' ? (
          createdIdeas.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {createdIdeas.map((idea) => (
                <IdeaCard
                  key={idea.id}
                  idea={idea}
                  onClick={() => navigate(`/ideas/${idea.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Nenhuma ideia criada
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Comece compartilhando sua primeira ideia!
              </p>
              <Button onClick={() => navigate('/ideas/new')}>
                Nova Ideia
              </Button>
            </div>
          )
        ) : presentingIdeas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {presentingIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onClick={() => navigate(`/ideas/${idea.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Nenhuma apresentação
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Voluntarie-se para apresentar uma ideia!
            </p>
            <Button onClick={() => navigate('/ideas?precisa_apresentador=true')}>
              Ver Ideias Disponíveis
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
