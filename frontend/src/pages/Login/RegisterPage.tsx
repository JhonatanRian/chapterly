import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/authStore';
import { Button, Input, Loading } from '@/components';

const registerSchema = z.object({
  username: z.string()
    .min(3, 'Usuário deve ter pelo menos 3 caracteres')
    .max(150, 'Usuário muito longo')
    .regex(/^[a-zA-Z0-9_]+$/, 'Apenas letras, números e underscore'),
  email: z.string()
    .email('Email inválido')
    .min(1, 'Email é obrigatório'),
  first_name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(150, 'Nome muito longo'),
  last_name: z.string()
    .min(2, 'Sobrenome deve ter pelo menos 2 caracteres')
    .max(150, 'Sobrenome muito longo'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(128, 'Senha muito longa'),
  password_confirm: z.string()
    .min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.password_confirm, {
  message: 'As senhas não coincidem',
  path: ['password_confirm'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await register(data);
      toast.success('Conta criada com sucesso! Você já está logado.');
      navigate('/dashboard');
    } catch (error: any) {
      const errorData = error.response?.data;

      // Handle specific field errors
      if (errorData) {
        if (errorData.username) {
          toast.error(`Usuário: ${errorData.username[0]}`);
        } else if (errorData.email) {
          toast.error(`Email: ${errorData.email[0]}`);
        } else if (errorData.password) {
          toast.error(`Senha: ${errorData.password[0]}`);
        } else {
          toast.error('Erro ao criar conta. Verifique os dados e tente novamente.');
        }
      } else {
        toast.error('Erro ao criar conta. Tente novamente mais tarde.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">Ch</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Criar conta
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Preencha os dados para começar
          </p>
        </div>

        {/* Register Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Usuário *
              </label>
              <Input
                id="username"
                type="text"
                placeholder="seu_usuario"
                {...registerField('username')}
                error={errors.username?.message}
                disabled={isLoading}
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Email *
              </label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                {...registerField('email')}
                error={errors.email?.message}
                disabled={isLoading}
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nome *
                </label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="João"
                  {...registerField('first_name')}
                  error={errors.first_name?.message}
                  disabled={isLoading}
                />
              </div>
              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Sobrenome *
                </label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Silva"
                  {...registerField('last_name')}
                  error={errors.last_name?.message}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Senha *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                {...registerField('password')}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="password_confirm"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Confirmar Senha *
              </label>
              <Input
                id="password_confirm"
                type="password"
                placeholder="Digite a senha novamente"
                {...registerField('password_confirm')}
                error={errors.password_confirm?.message}
                disabled={isLoading}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full mt-6"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loading />
                  <span>Criando conta...</span>
                </div>
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Ou
              </span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Já tem uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
              >
                Faça login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          © 2025 Chapterly. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
