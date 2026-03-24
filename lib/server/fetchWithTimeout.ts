export interface FetchJsonWithTimeoutOptions extends Omit<RequestInit, "signal"> {
    source: string;
    timeoutMs?: number;
}

export interface SourceFetchErrorOptions {
    source: string;
    status?: number;
    isTimeout?: boolean;
    cause?: unknown;
}

export class SourceFetchError extends Error {
    source: string;
    status?: number;
    isTimeout: boolean;

    constructor(message: string, options: SourceFetchErrorOptions) {
        super(message);
        this.name = "SourceFetchError";
        this.source = options.source;
        this.status = options.status;
        this.isTimeout = options.isTimeout ?? false;

        if (options.cause !== undefined) {
            this.cause = options.cause;
        }
    }
}

const DEFAULT_TIMEOUT_MS = 8_000;

export async function fetchJsonWithTimeout<T>(
    url: string,
    options: FetchJsonWithTimeoutOptions
): Promise<T> {
    const { source, timeoutMs = DEFAULT_TIMEOUT_MS, ...requestOptions } = options;
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...requestOptions,
            signal: controller.signal,
        });

        if (!response.ok) {
            throw new SourceFetchError(`${source} hatasi: ${response.status}`, {
                source,
                status: response.status,
            });
        }

        return (await response.json()) as T;
    } catch (error) {
        if (error instanceof SourceFetchError) {
            throw error;
        }

        if (error instanceof Error && error.name === "AbortError") {
            throw new SourceFetchError(`${source} istegi zaman asimina ugradi`, {
                source,
                isTimeout: true,
                cause: error,
            });
        }

        throw new SourceFetchError(`${source} istegi basarisiz oldu`, {
            source,
            cause: error,
        });
    } finally {
        clearTimeout(timeoutHandle);
    }
}
