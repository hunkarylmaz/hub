/** POST /api/extension/support-requests başarı yanıtı sözleşmesi. */
export interface SupportRequestResponse {
  success: true;
  ticketNumber: string;
  message: string;
}

export function buildSupportRequestResponse(ticketNumber: string): SupportRequestResponse {
  return {
    success: true,
    ticketNumber,
    message: 'Destek talebiniz oluşturuldu.'
  };
}
