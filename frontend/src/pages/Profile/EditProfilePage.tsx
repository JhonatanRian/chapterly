import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MainLayout, Button, Avatar, Loading } from "@/components";
import { AnimatedPage } from "@/components/animations";
import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export function EditProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user?.avatar || null,
  );

  const [passwordData, setPasswordData] = useState({
    old_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await authService.updateProfile(data);
      return response;
    },
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
      toast.success("Perfil atualizado com sucesso!");
      navigate("/profile");
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message || "Erro ao atualizar perfil";
      toast.error(message);
    },
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: authService.changePassword,
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setPasswordData({
        old_password: "",
        new_password: "",
        confirm_password: "",
      });
      setShowPasswordSection(false);
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.old_password?.[0] ||
        error.response?.data?.new_password?.[0] ||
        error.response?.data?.message ||
        "Erro ao alterar senha";
      toast.error(message);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 5MB");
        return;
      }

      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas imagens são permitidas");
        return;
      }

      setAvatarFile(file);

      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleSubmitProfile = (e: React.FormEvent) => {
    e.preventDefault();

    const data = new FormData();
    data.append("first_name", formData.first_name);
    data.append("last_name", formData.last_name);
    data.append("email", formData.email);

    if (avatarFile) {
      data.append("avatar", avatarFile);
    }

    updateProfileMutation.mutate(data);
  };

  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("As senhas não coincidem");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    changePasswordMutation.mutate({
      old_password: passwordData.old_password,
      new_password: passwordData.new_password,
    });
  };

  return (
    <MainLayout>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Editar Perfil
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Atualize suas informações pessoais
            </p>
          </div>

          {/* Profile Form */}
          <form
            onSubmit={handleSubmitProfile}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Informações Pessoais
            </h2>

            {/* Avatar Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Foto de Perfil
              </label>
              <div className="flex items-center gap-6">
                <Avatar
                  user={user || undefined}
                  src={avatarPreview || undefined}
                  size="xl"
                />
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                    <span className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors text-sm">
                      {avatarPreview ? "Trocar Foto" : "Adicionar Foto"}
                    </span>
                  </label>
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors text-sm"
                    >
                      Remover Foto
                    </button>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG ou GIF. Máx. 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nome
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Seu nome"
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Sobrenome
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Seu sobrenome"
                />
              </div>
            </div>

            {/* Email */}
            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="seu@email.com"
                required
              />
            </div>

            {/* Username (read-only) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome de Usuário
              </label>
              <input
                type="text"
                value={user?.username || ""}
                disabled
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                O nome de usuário não pode ser alterado
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="flex-1"
              >
                {updateProfileMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loading />
                    <span>Salvando...</span>
                  </div>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/profile")}
              >
                Cancelar
              </Button>
            </div>
          </form>

          {/* Password Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Alterar Senha
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Mantenha sua conta segura
                </p>
              </div>
              {!showPasswordSection && (
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordSection(true)}
                >
                  Alterar Senha
                </Button>
              )}
            </div>

            {showPasswordSection && (
              <form onSubmit={handleSubmitPassword} className="space-y-4">
                <div>
                  <label
                    htmlFor="old_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    id="old_password"
                    name="old_password"
                    value={passwordData.old_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="new_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    id="new_password"
                    name="new_password"
                    value={passwordData.new_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    minLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Mínimo de 6 caracteres
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm_password"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    id="confirm_password"
                    name="confirm_password"
                    value={passwordData.confirm_password}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="flex-1"
                  >
                    {changePasswordMutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loading />
                        <span>Alterando...</span>
                      </div>
                    ) : (
                      "Alterar Senha"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowPasswordSection(false);
                      setPasswordData({
                        old_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </AnimatedPage>
    </MainLayout>
  );
}
