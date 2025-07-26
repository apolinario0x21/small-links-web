"use client";

import { useState, useEffect } from "react";
import {
  LinkIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface ShortenResponse {
  created_at: string;
  original_url: string;
  short_url: string;
}

interface StatsResponse {
  short_id: string;
  original_url: string;
  created_at: string;
  access_count: number;
}

interface HealthStatus {
  status: "healthy" | "unhealthy" | "checking";
  total_urls?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState<ShortenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState<HealthStatus>({status: "checking",});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setShortenedUrl(null);
    setCopied(false);

    let processedUrl = url.trim();

    if (!processedUrl) {
      setError("Por favor, insira uma URL.");
      setLoading(false);
      return;
    }

    // Adiciona 'https://' se não estiver presente
    if (!/^https?:\/\//i.test(processedUrl)) {
      processedUrl = `https://${processedUrl}`;
    }

    try {
      const apiUrl = `${API_BASE_URL}/shorten?url=${encodeURIComponent(
        processedUrl
      )}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Não foi possível encurtar a URL.");
      }

      const data: ShortenResponse = await response.json();

      setShortenedUrl({ ...data, original_url: processedUrl });
    } catch (err: unknown) {
      if(err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (shortenedUrl) {
      navigator.clipboard.writeText(shortenedUrl.short_url);
      setCopied(true);

      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFetchStats = async () => {
    if (!shortenedUrl) return;

    const shortId = shortenedUrl.short_url.split("/").pop();

    if (!shortId) {
      setError("Não foi possível extrair o ID da URL curta.");
      return;
    }

    setStatsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/stats/${shortId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Não foi possível buscar as estatísticas.");
      }
      const data: StatsResponse = await response.json();
      setStats(data);
      setIsStatsModalOpen(true);
    } catch (err: unknown) {
      if(err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocorreu um erro desconhecido. Tente novamente.");
      }
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    const checkApiHealth = async () => {
      try {  
        const response = await fetch(`${API_BASE_URL}/health` );
        if (!response.ok) throw new Error("API offline");
        const data = await response.json();
        setApiStatus({ status: "healthy", total_urls: data.total_urls });
      } catch (error) {
        setApiStatus({ status: "unhealthy" });
      }
    };

    checkApiHealth();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4 relative">
      <div className="w-full max-w-2xl z-10">
        <h1 className="text-5xl md:text-6xl font-bold text-center mb-2">
          Small Links
        </h1>
        <p className="text-gray-400 text-center mb-8">
          Simples, rápido e direto ao ponto.
        </p>

        {/* Formulário (sem alterações) */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-4 mb-6"
        >
          <div className="relative flex-grow">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Ex: facebook.com"
              className="w-full pl-10 pr-4 py-3 rounded-md bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-md flex items-center justify-center transition"
          >
            {loading ? (
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Encurtar URL"
            )}
          </button>
        </form>

        {/* Área de Erro (sem alterações) */}
        {error && (
          <div
            className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-md mb-6"
            role="alert"
          >
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Área de Resultado - ATUALIZADA */}
        {shortenedUrl && (
          <div className="bg-gray-800 border border-gray-700 rounded-md p-6 animate-fade-in">
            <h2 className="text-lg font-semibold mb-3 text-green-400">
              URL Encurtada com Sucesso!
            </h2>
            <div className="flex flex-col md:flex-row items-center gap-4 bg-gray-900 p-4 rounded-md">
              <a
                href={shortenedUrl.short_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-grow text-blue-400 hover:text-blue-300 break-all"
              >
                <span className="text-gray-500">
                  {/* Pega o host, ex: "API_BASE_URL..." e trunca */}
                  {new URL(shortenedUrl.short_url).hostname
                    .replace("www.", "")
                    .substring(0, 12)}
                  ...
                </span>
                <span className="text-white font-bold">
                  {/* Pega o caminho, ex: "/abc123" */}
                  {new URL(shortenedUrl.short_url).pathname}
                </span>
              </a>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition"
                >
                  {copied ? (
                    <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-400" />
                  ) : (
                    <ClipboardDocumentIcon className="h-5 w-5 text-gray-300" />
                  )}
                  {copied ? "Copiado!" : "Copiar"}
                </button>
                <button
                  onClick={handleFetchStats}
                  disabled={statsLoading}
                  className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2 transition disabled:cursor-not-allowed"
                >
                  <ChartBarIcon className="h-5 w-5 text-gray-300" />
                  {statsLoading ? "Buscando..." : "Estatísticas"}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              URL Original:{" "}
              <span className="text-gray-400 break-all">
                {shortenedUrl.original_url}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* NOVO: Modal de Estatísticas */}
      {isStatsModalOpen && stats && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg p-6 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-white">
                Estatísticas da URL
              </h3>
              <button
                onClick={() => setIsStatsModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4 text-gray-300">
              <div>
                <p className="text-sm text-gray-500">URL Curta</p>
                <a
                  href={`${API_BASE_URL}/${stats.short_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-400 break-all"
                >{`.../${stats.short_id}`}</a>
              </div>
              <div>
                <p className="text-sm text-gray-500">URL Original</p>
                <p className="font-mono text-white break-all">
                  {stats.original_url}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Criação</p>
                <p className="font-mono text-white">
                  {new Date(stats.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total de Acessos</p>
                <p className="font-mono text-white text-2xl font-bold">
                  {stats.access_count}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOVO: Rodapé com Status da API */}
      <footer className="absolute bottom-4 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              apiStatus.status === "healthy"
                ? "bg-green-500"
                : apiStatus.status === "unhealthy"
                ? "bg-red-500"
                : "bg-yellow-500"
            }`}
          ></span>
          <span>
            {apiStatus.status === "healthy" &&
              `API Online | ${apiStatus.total_urls} URLs criadas`}
            {apiStatus.status === "unhealthy" && "API Offline"}
            {apiStatus.status === "checking" && "Verificando status da API..."}
          </span>
        </div>
      </footer>
    </main>
  );
}
