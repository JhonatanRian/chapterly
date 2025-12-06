import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  MainLayout,
  Button,
  Input,
  Textarea,
  ImageUpload,
  RichTextEditor,
  TagSelector,
  Loading,
  ConfirmModal,
} from "@/components";
import { AnimatedPage } from "@/components/animations";
import { ideasService } from "@/services/ideas.service";
import { handleApiError } from "@/utils/errorHandler";
import {
  invalidateIdeaQueries,
  removeIdeaFromCache,
} from "@/utils/queryInvalidation";
import { useIdeaPermissions } from "@/hooks/useIdeaPermissions";
import type { IdeaPriority } from "@/types";

const ideaFormSchema = z.object({
  titulo: z
    .string()
    .min(5, "Título deve ter pelo menos 5 caracteres")
    .max(200, "Título muito longo"),
  descricao: z
    .string()
    .min(10, "Descrição deve ter pelo menos 10 caracteres")
    .max(500, "Descrição muito longa"),
  conteudo: z.string().min(20, "Conteúdo deve ter pelo menos 20 caracteres"),
  imagem: z.instanceof(File).nullable().optional(),
  tags: z.array(z.number()).min(1, "Selecione pelo menos uma tag"),
  prioridade: z.enum(["baixa", "media", "alta"]),
  quero_apresentar: z.boolean().optional(),
  data_agendada: z.string().optional(),
});

type IdeaFormData = z.infer<typeof ideaFormSchema>;

export function IdeaFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Fetch idea details if editing
  // Fetch idea if editing
  const { data: idea, isLoading: ideaLoading } = useQuery({
    queryKey: ["idea", id],
    queryFn: () => ideasService.getIdea(Number(id)),
    enabled: isEditMode,
  });

  // Fetch permissions if editing
  const { data: permissions, isLoading: permissionsLoading } =
    useIdeaPermissions(id);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<IdeaFormData>({
    resolver: zodResolver(ideaFormSchema),
    defaultValues: {
      titulo: "",
      descricao: "",
      conteudo: "",
      imagem: null,
      tags: [],
      prioridade: "media",
      quero_apresentar: false,
      data_agendada: "",
    },
  });

  // Ensure prioridade always has a value
  useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === "prioridade" && !value.prioridade) {
        setValue("prioridade", "media");
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  // Load idea data into form when editing
  useEffect(() => {
    if (idea && isEditMode) {
      reset({
        titulo: idea.titulo,
        descricao: idea.descricao,
        conteudo: idea.conteudo,
        imagem: null, // Can't set File from URL
        tags: idea.tags.map((tag) => tag.id),
        prioridade: idea.prioridade,
        quero_apresentar: !!idea.apresentador,
        data_agendada: idea.data_agendada || "",
      });
      if (idea.imagem) {
        setImagePreview(idea.imagem);
      }
    }
  }, [idea, isEditMode, reset]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: IdeaFormData) => {
      // Ensure prioridade is always set
      const cleanData = {
        ...data,
        prioridade: data.prioridade || "media",
      };
      return ideasService.createIdea(cleanData);
    },
    onSuccess: (data) => {
      toast.success("Ideia criada com sucesso!");
      // Invalida todas as queries de ideias para sincronizar com dashboard, listas, etc
      invalidateIdeaQueries(queryClient);
      navigate(`/ideas/${data.id}`);
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao criar tema");
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: IdeaFormData) => {
      // Ensure prioridade is always set
      const cleanData = {
        ...data,
        prioridade: data.prioridade || "media",
      };
      return ideasService.updateIdea(Number(id), cleanData);
    },
    onSuccess: () => {
      toast.success("Ideia atualizada com sucesso!");
      // Invalida todas as queries relacionadas para refletir mudanças em todas as páginas
      invalidateIdeaQueries(queryClient, Number(id));
      navigate(`/ideas/${id}`);
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao atualizar ideia");
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => ideasService.deleteIdea(Number(id)),
    onSuccess: () => {
      toast.success("Ideia excluída com sucesso!");
      // Remove do cache e invalida listas
      removeIdeaFromCache(queryClient, Number(id));
      navigate("/ideas");
    },
    onError: (error: any) => {
      handleApiError(error, "Erro ao excluir ideia");
    },
  });

  const onSubmit = async (data: IdeaFormData) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  // Loading state
  if (ideaLoading || (isEditMode && permissionsLoading)) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-96">
          <Loading />
        </div>
      </MainLayout>
    );
  }

  // Check if user has permission to edit
  if (isEditMode && permissions && !permissions.editable) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Acesso negado
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Você não tem permissão para editar esta ideia.
          </p>
          <Button onClick={() => navigate(`/ideas/${id}`)}>
            Voltar para a ideia
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  return (
    <MainLayout>
      <AnimatedPage>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Voltar</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {isEditMode ? "Editar Tema" : "Novo Tema"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isEditMode
              ? "Atualize as informações da sua ideia"
              : "Compartilhe sua ideia para a próxima apresentação"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl">
          <div className="space-y-6">
            {/* Title */}
            <Input
              label="Título"
              placeholder="Digite um título chamativo"
              {...register("titulo")}
              error={errors.titulo?.message}
              disabled={isMutating}
              required
            />

            {/* Description */}
            <Textarea
              label="Descrição Curta"
              placeholder="Resumo em poucas palavras (aparece nos cards)"
              rows={3}
              {...register("descricao")}
              error={errors.descricao?.message}
              disabled={isMutating}
              required
            />

            {/* Content (Rich Text) */}
            <Controller
              name="conteudo"
              control={control}
              render={({ field }) => (
                <RichTextEditor
                  label="Conteúdo Completo"
                  placeholder="Descreva sua ideia em detalhes..."
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.conteudo?.message}
                  disabled={isMutating}
                  height={500}
                />
              )}
            />

            {/* Image Upload */}
            <Controller
              name="imagem"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  label="Imagem de Capa (opcional)"
                  value={field.value || imagePreview}
                  onChange={(file) => {
                    field.onChange(file);
                    if (file) {
                      setImagePreview(URL.createObjectURL(file));
                    }
                  }}
                  onError={(error) => toast.error(error)}
                  disabled={isMutating}
                  maxSizeMB={5}
                />
              )}
            />

            {/* Tags */}
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagSelector
                  label="Tags"
                  selectedTags={field.value}
                  onChange={field.onChange}
                  error={errors.tags?.message}
                  disabled={isMutating}
                />
              )}
            />

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prioridade <span className="text-red-500">*</span>
              </label>
              <Controller
                name="prioridade"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    {(["baixa", "media", "alta"] as IdeaPriority[]).map(
                      (priority) => (
                        <label
                          key={priority}
                          className={`flex-1 cursor-pointer ${isMutating ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <input
                            type="radio"
                            value={priority}
                            checked={field.value === priority}
                            onChange={() => field.onChange(priority)}
                            disabled={isMutating}
                            className="sr-only"
                          />
                          <div
                            className={`p-4 border-2 rounded-lg text-center transition-all ${
                              field.value === priority
                                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                              {priority}
                            </div>
                          </div>
                        </label>
                      ),
                    )}
                  </div>
                )}
              />
              {errors.prioridade && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {errors.prioridade.message}
                </p>
              )}
            </div>

            {/* Want to present */}
            {!isEditMode && (
              <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <input
                  type="checkbox"
                  id="quero_apresentar"
                  {...register("quero_apresentar")}
                  disabled={isMutating}
                  className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor="quero_apresentar"
                  className="flex-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <span className="font-medium">
                    Quero apresentar esta ideia
                  </span>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Marque esta opção se você deseja ser o apresentador desta
                    ideia
                  </p>
                </label>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteModal(true)}
                    disabled={isMutating}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Excluir Ideia
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(-1)}
                  disabled={isMutating}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isMutating || isSubmitting}>
                  {isMutating ? (
                    <div className="flex items-center gap-2">
                      <Loading />
                      <span>{isEditMode ? "Salvando..." : "Criando..."}</span>
                    </div>
                  ) : isEditMode ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Tema"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </form>

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          title="Excluir Ideia"
          message="Tem certeza que deseja excluir esta ideia? Esta ação não pode ser desfeita."
          confirmText="Excluir"
          cancelText="Cancelar"
          confirmVariant="danger"
          isLoading={deleteMutation.isPending}
        />
      </AnimatedPage>
    </MainLayout>
  );
}
