/**
 * Extrai e formata mensagens de erro de respostas da API Django REST.
 * Suporta múltiplos formatos de erro.
 */

export const extractErrorMessage = (error: any): string => {
  // Erro com response da API
  if (error.response?.data) {
    const data = error.response.data;
    
    // Erro de campo específico (ex: {"conteudo": ["mensagem"]})
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Pegar primeira mensagem do primeiro campo
      const firstField = Object.keys(data)[0];
      if (firstField && Array.isArray(data[firstField])) {
        return data[firstField][0];
      }
      if (firstField && typeof data[firstField] === 'string') {
        return data[firstField];
      }
    }
    
    // Erro com campo "detail" (ex: {"detail": "mensagem"})
    if (data.detail) {
      return data.detail;
    }
    
    // Erro com campo "message"
    if (data.message) {
      return data.message;
    }
  }
  
  // Fallback para erro de rede ou desconhecido
  return error.message || "Erro desconhecido. Tente novamente.";
};

/**
 * Verifica se o erro é de duplicata de conteúdo.
 */
export const isDuplicateContentError = (error: any): boolean => {
  const message = extractErrorMessage(error).toLowerCase();
  return message.includes("já existe") && message.includes("conteúdo");
};
