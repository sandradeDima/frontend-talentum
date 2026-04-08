export type ApiEnvelope<T> = {
  error: boolean;
  mensaje: string;
  data: T;
  mensajeTecnico: string | null;
};

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly mensajeTecnico: string | null;

  constructor(message: string, status: number, mensajeTecnico: string | null = null) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.mensajeTecnico = mensajeTecnico;
  }
}
