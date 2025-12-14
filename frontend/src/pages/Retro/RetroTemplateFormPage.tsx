import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { retroTemplatesService } from "../../services/retros.service";
import type { RetroTemplateCategory } from "../../types";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  MainLayout,
  Button,
  Loading,
} from "@/components";
import { AnimatedPage } from "@/components/animations";

interface TemplateFormData {
  nome: string;
  descricao: string;
  categorias: RetroTemplateCategory[];
  is_default: boolean;
}

const EMOJI_SUGGESTIONS = ["🚀", "🛑", "✅", "😊", "😢", "😠", "👍", "🔧", "📋", "❤️", "📚", "❌", "💭", "🎯", "💡", "⚠️", "🌟", "🔥", "💪", "🎉"];
const COLOR_SUGGESTIONS = ["#10b981", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#84cc16"];

const RetroTemplateFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<TemplateFormData>({
    nome: "",
    descricao: "",
    categorias: [
      { name: "", slug: "", icon: "🎯", color: "#3b82f6" }
    ],
    is_default: false,
  });

  // Carregar template existente se estiver editando
  const { data: template, isLoading: loadingTemplate } = useQuery({
    queryKey: ["retro-template", id],
    queryFn: () => retroTemplatesService.getById(Number(id)),
    enabled: isEditMode,
  });

  useEffect(() => {
    if (template) {
      setFormData({
        nome: template.nome,
        descricao: template.descricao || "",
        categorias: template.categorias || [],
        is_default: template.is_default,
      });
    }
  }, [template]);

  const createMutation = useMutation({
    mutationFn: (data: Partial<TemplateFormData>) => retroTemplatesService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["retro-templates"] });
      toast.success("Template criado com sucesso!");
      navigate("/retros/templates");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao criar template");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TemplateFormData>) =>
      retroTemplatesService.update(Number(id), data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["retro-templates"] });
      await queryClient.invalidateQueries({ queryKey: ["retro-template", id] });
      toast.success("Template atualizado com sucesso!");
      navigate("/retros/templates");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Erro ao atualizar template");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!formData.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (formData.categorias.length === 0) {
      toast.error("Adicione pelo menos uma categoria");
      return;
    }

    for (const cat of formData.categorias) {
      if (!cat.name.trim() || !cat.slug.trim()) {
        toast.error("Todas as categorias devem ter nome e slug");
        return;
      }
    }

    // Verificar slugs duplicados
    const slugs = formData.categorias.map(c => c.slug);
    if (new Set(slugs).size !== slugs.length) {
      toast.error("Os slugs das categorias devem ser únicos");
      return;
    }

    if (isEditMode) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categorias: [
        ...prev.categorias,
        { name: "", slug: "", icon: "🎯", color: "#3b82f6" }
      ]
    }));
  };

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.filter((_, i) => i !== index)
    }));
  };

  const updateCategory = (index: number, field: keyof RetroTemplateCategory, value: string) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }));
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");
  };

  if (isEditMode && loadingTemplate) {
    return (
      <MainLayout>
        <AnimatedPage>
          <Loading />
        </AnimatedPage>
      </MainLayout>
    );
  }

  // Verificar se é template do sistema (não pode editar)
  if (isEditMode && template?.is_system) {
    return (
      <MainLayout>
        <AnimatedPage>
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  Template do Sistema
                </h3>
                <p className="text-yellow-800 dark:text-yellow-300 mb-4">
                  Templates do sistema não podem ser editados. Eles são mantidos pelo Chapterly para garantir padrões consistentes.
                </p>
                <Button variant="secondary" onClick={() => navigate("/retros/templates")}>
                  Voltar para Templates
                </Button>
              </div>
            </div>
          </div>
        </AnimatedPage>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <AnimatedPage>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate("/retros/templates")}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {isEditMode ? "Editar Template" : "Novo Template"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEditMode
                ? "Atualize as informações do template"
                : "Crie um novo template personalizado para retrospectivas"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Informações Básicas
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nome do Template *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Start/Stop/Continue"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descreva quando e como usar este template..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_default: e.target.checked }))}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">
                    Definir como template padrão
                  </label>
                </div>
              </div>
            </div>

            {/* Categorias */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Categorias
                </h2>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addCategory}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Categoria
                </Button>
              </div>

              <div className="space-y-4">
                {formData.categorias.map((categoria, index) => (
                  <div
                    key={index}
                    className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Nome *
                            </label>
                            <input
                              type="text"
                              value={categoria.name}
                              onChange={(e) => {
                                updateCategory(index, "name", e.target.value);
                                // Auto-gerar slug se estiver vazio
                                if (!categoria.slug) {
                                  updateCategory(index, "slug", generateSlug(e.target.value));
                                }
                              }}
                              placeholder="Ex: O que deu certo"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Slug (identificador) *
                            </label>
                            <input
                              type="text"
                              value={categoria.slug}
                              onChange={(e) => updateCategory(index, "slug", e.target.value)}
                              placeholder="Ex: deu_certo"
                              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Emoji/Ícone
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={categoria.icon}
                                onChange={(e) => updateCategory(index, "icon", e.target.value)}
                                placeholder="🎯"
                                maxLength={2}
                                className="w-20 px-3 py-2 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <div className="flex flex-wrap gap-1">
                                {EMOJI_SUGGESTIONS.map(emoji => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => updateCategory(index, "icon", emoji)}
                                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Cor
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="color"
                                value={categoria.color}
                                onChange={(e) => updateCategory(index, "color", e.target.value)}
                                className="w-20 h-10 rounded cursor-pointer"
                              />
                              <div className="flex flex-wrap gap-1">
                                {COLOR_SUGGESTIONS.map(color => (
                                  <button
                                    key={color}
                                    type="button"
                                    onClick={() => updateCategory(index, "color", color)}
                                    className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Preview */}
                        <div className="pt-2">
                          <div 
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                            style={{ 
                              backgroundColor: `${categoria.color}20`,
                              color: categoria.color,
                              borderColor: categoria.color,
                              borderWidth: '1px'
                            }}
                          >
                            <span className="text-base">{categoria.icon}</span>
                            <span>{categoria.name || "Preview"}</span>
                          </div>
                        </div>
                      </div>

                      {formData.categorias.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCategory(index)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Remover categoria"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/retros/templates")}
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
                  ? "Atualizar Template"
                  : "Criar Template"}
              </Button>
            </div>
          </form>
        </div>
      </AnimatedPage>
    </MainLayout>
  );
};

export default RetroTemplateFormPage;
