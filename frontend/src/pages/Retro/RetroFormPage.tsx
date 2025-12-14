import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { retrosService, retroTemplatesService } from "../../services/retros.service";
import type { RetroFormData } from "../../types";
import { ArrowLeft, Save, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  MainLayout,
  Button,
  Loading,
} from "@/components";
import { AnimatedPage } from "@/components/animations";

const RetroFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<RetroFormData>({
    titulo: "",
    descricao: "",
    data: new Date().toISOString().slice(0, 16),
    status: "rascunho",
    template: 0,
    participantes_ids: [],
  });

  // Carregar templates
  const { data: templates } = useQuery({
    queryKey: ["retro-templates"],
    queryFn: () => retroTemplatesService.getAll(),
  });

  // Carregar retro existente se estiver editando
  const { data: retro, isLoading: loadingRetro } = useQuery({
    queryKey: ["retro", id],
    queryFn: () => retrosService.getById(Number(id)),
    enabled: isEditMode,
  });

  // Definir dados do formulário quando retro for carregada
  useEffect(() => {
    if (retro) {
      setFormData({
        titulo: retro.titulo,
        descricao: retro.descricao,
        data: retro.data.slice(0, 16), // Format for datetime-local input
        status: retro.status,
        template: retro.template.id,
        participantes_ids: retro.participantes.map((p) => p.id),
      });
    }
  }, [retro]);

  // Definir template padrão quando templates forem carregados
  useEffect(() => {
    if (templates?.results && templates.results.length > 0 && !isEditMode) {
      const defaultTemplate = templates.results.find((t) => t.is_default);
      if (defaultTemplate) {
        setFormData((prev) => ({ ...prev, template: defaultTemplate.id }));
      } else {
        setFormData((prev) => ({ ...prev, template: templates.results[0].id }));
      }
    }
  }, [templates, isEditMode]);

  // Mutation para criar
  const createMutation = useMutation({
    mutationFn: (data: RetroFormData) => retrosService.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retrospectiva criada com sucesso!");
      navigate(`/retros/${data.id}`);
    },
    onError: () => {
      toast.error("Erro ao criar retrospectiva");
    },
  });

  // Mutation para atualizar
  const updateMutation = useMutation({
    mutationFn: (data: Partial<RetroFormData>) =>
      retrosService.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retro", id] });
      queryClient.invalidateQueries({ queryKey: ["retros"] });
      toast.success("Retrospectiva atualizada com sucesso!");
      navigate(`/retros/${id}`);
    },
    onError: () => {
      toast.error("Erro ao atualizar retrospectiva");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error("Título é obrigatório");
      return;
    }

    if (!formData.template) {
      toast.error("Selecione um template");
      return;
    }

    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isEditMode && loadingRetro) {
    return (
      <MainLayout>
        <AnimatedPage>
          <Loading />
        </AnimatedPage>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <AnimatedPage>
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditMode ? "Editar Retrospectiva" : "Nova Retrospectiva"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode
                ? "Atualize as informações da retrospectiva"
                : "Crie uma nova retrospectiva para o time"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="space-y-6">
              {/* Título */}
              <div>
                <label
                  htmlFor="titulo"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Título *
                </label>
                <input
                  type="text"
                  id="titulo"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleChange}
                  placeholder="Ex: Retro Sprint 15"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label
                  htmlFor="descricao"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Descrição
                </label>
                <textarea
                  id="descricao"
                  name="descricao"
                  value={formData.descricao}
                  onChange={handleChange}
                  placeholder="Descreva o contexto desta retrospectiva..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Data e Hora */}
              <div>
                <label
                  htmlFor="data"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Data e Hora *
                </label>
                <div className="relative">
                  <Calendar
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
                    size={20}
                  />
                  <input
                    type="datetime-local"
                    id="data"
                    name="data"
                    value={formData.data}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* Template */}
              <div>
                <label
                  htmlFor="template"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Template *
                </label>
                <select
                  id="template"
                  name="template"
                  value={formData.template}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Selecione um template</option>
                  {templates?.results?.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.nome}
                      {template.is_default && " (Padrão)"}
                    </option>
                  ))}
                </select>
                {templates?.results &&
                  formData.template &&
                  templates.results.find((t) => t.id === Number(formData.template))
                    ?.descricao && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {
                        templates.results.find((t) => t.id === Number(formData.template))
                          ?.descricao
                      }
                    </p>
                  )}
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Status *
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="rascunho">Rascunho</option>
                  <option value="em_andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : isEditMode
                  ? "Atualizar"
                  : "Criar Retrospectiva"}
              </Button>
            </div>
          </form>
        </div>
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroFormPage;
