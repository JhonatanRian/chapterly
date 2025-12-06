import { toast } from 'sonner';

/**
 * Interface para erros de validação do Django
 */
export interface DjangoValidationError {
  [field: string]: string[];
}

/**
 * Interface para erros de API genéricos
 */
export interface ApiErrorResponse {
  detail?: string;
  non_field_errors?: string[];
  [field: string]: any;
}

/**
 * Formata erros de validação do Django para exibição
 *
 * @param error - Objeto de erro da API
 * @returns Mensagem de erro formatada
 *
 * @example
 * // Erro de campo específico
 * formatDjangoError({ descricao: ["A descrição deve ter pelo menos 10 caracteres."] })
 * // Retorna: "Descrição: A descrição deve ter pelo menos 10 caracteres."
 *
 * @example
 * // Múltiplos campos
 * formatDjangoError({
 *   titulo: ["Este campo é obrigatório."],
 *   prioridade: ["\"undefined\" não é uma escolha válida."]
 * })
 * // Retorna: "Título: Este campo é obrigatório.\nPrioridade: \"undefined\" não é uma escolha válida."
 *
 * @example
 * // Erro geral (detail)
 * formatDjangoError({ detail: "Você não tem permissão." })
 * // Retorna: "Você não tem permissão."
 *
 * @example
 * // non_field_errors
 * formatDjangoError({ non_field_errors: ["Erro de validação geral."] })
 * // Retorna: "Erro de validação geral."
 */
export function formatDjangoError(errorResponse: any): string {
  if (!errorResponse) {
    return 'Erro desconhecido. Tente novamente.';
  }

  // Se for um erro com 'detail' (comum em APIException do Django)
  if (errorResponse.detail) {
    return errorResponse.detail;
  }

  // Se tiver non_field_errors (erros gerais de validação)
  if (errorResponse.non_field_errors && Array.isArray(errorResponse.non_field_errors)) {
    return errorResponse.non_field_errors.join('\n');
  }

  // Se for um objeto com erros de campo (ValidationError do Django)
  const fieldErrors: string[] = [];
  const fieldNameMap: Record<string, string> = {
    titulo: 'Título',
    descricao: 'Descrição',
    conteudo: 'Conteúdo',
    imagem: 'Imagem',
    tags: 'Tags',
    prioridade: 'Prioridade',
    data_agendada: 'Data Agendada',
    status: 'Status',
    username: 'Nome de usuário',
    email: 'E-mail',
    password: 'Senha',
    password_confirm: 'Confirmação de senha',
    first_name: 'Nome',
    last_name: 'Sobrenome',
    quero_apresentar: 'Quero apresentar',
  };

  Object.keys(errorResponse).forEach((field) => {
    const errors = errorResponse[field];

    // Ignora campos que não são erros
    if (field === 'detail' || field === 'status' || field === 'statusText') {
      return;
    }

    if (Array.isArray(errors) && errors.length > 0) {
      const fieldLabel = fieldNameMap[field] || capitalizeFirstLetter(field);
      const errorMessages = errors.join(' ');
      fieldErrors.push(`${fieldLabel}: ${errorMessages}`);
    }
  });

  if (fieldErrors.length > 0) {
    return fieldErrors.join('\n');
  }

  // Fallback genérico
  return 'Erro ao processar requisição. Verifique os dados e tente novamente.';
}

/**
 * Exibe erros do Django como toast
 *
 * @param error - Objeto de erro do Axios/API
 * @param fallbackMessage - Mensagem padrão caso não consiga extrair erro
 *
 * @example
 * handleApiError(error, "Erro ao criar ideia");
 */
export function handleApiError(error: any, fallbackMessage: string = 'Erro ao processar requisição'): void {
  const errorData = error?.response?.data;

  if (errorData) {
    const message = formatDjangoError(errorData);

    // Se houver múltiplos erros de campo, exibe cada um separadamente
    const messages = message.split('\n');
    if (messages.length > 1) {
      messages.forEach((msg) => {
        toast.error(msg, { duration: 5000 });
      });
    } else {
      toast.error(message, { duration: 4000 });
    }
  } else {
    // Erro de rede ou desconhecido
    toast.error(fallbackMessage);
  }
}

/**
 * Extrai erros de campo do Django para usar com React Hook Form
 *
 * @param errorResponse - Resposta de erro da API
 * @returns Objeto com erros por campo
 *
 * @example
 * const fieldErrors = extractFieldErrors(error.response.data);
 * // Retorna: { titulo: "Este campo é obrigatório.", prioridade: "Escolha inválida." }
 */
export function extractFieldErrors(errorResponse: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};

  if (!errorResponse || typeof errorResponse !== 'object') {
    return fieldErrors;
  }

  Object.keys(errorResponse).forEach((field) => {
    const errors = errorResponse[field];

    if (Array.isArray(errors) && errors.length > 0) {
      // Pega a primeira mensagem de erro do campo
      fieldErrors[field] = errors[0];
    }
  });

  return fieldErrors;
}

/**
 * Capitaliza a primeira letra de uma string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/**
 * Verifica se é um erro de autenticação (401)
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401;
}

/**
 * Verifica se é um erro de permissão (403)
 */
export function isPermissionError(error: any): boolean {
  return error?.response?.status === 403;
}

/**
 * Verifica se é um erro de não encontrado (404)
 */
export function isNotFoundError(error: any): boolean {
  return error?.response?.status === 404;
}

/**
 * Verifica se é um erro de validação (400)
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 400;
}

/**
 * Verifica se é um erro de servidor (5xx)
 */
export function isServerError(error: any): boolean {
  const status = error?.response?.status;
  return status >= 500 && status < 600;
}
