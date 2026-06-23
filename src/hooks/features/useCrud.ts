import { useState, useCallback, useEffect } from "react";
import type {
    Atleta, CreateAtleta, UpdateAtleta, CrudState, AtletaFilters, PaginationState, SortState
} from "../../types/Atleta";
import { AtletasService } from "../../api/services/AtletasService";

export interface CrudOperations {
    atletas: Atleta[];
    loading: boolean;
    error: string | null;
    selectedAtleta: Atleta | null;
    loadAtletas: (filters?: AtletaFilters, pagination?: PaginationState) => Promise<void>;
    createAtleta: (data: CreateAtleta) => Promise<void>;
    updateAtleta: (id: string, data: UpdateAtleta) => Promise<void>;
    deleteAtleta: (id: string) => Promise<void>;
    selectAtleta: (atleta: Atleta | null) => void;
    clearError: () => void;
}

export const useCrud = (): CrudOperations => {
    const [state, setState] = useState<CrudState>({
        atletas: [],
        loading: false,
        error: null,
        selectedAtleta: null,
    });

    const loadAtletas = useCallback(async (
        filters?: AtletaFilters,
        pagination?: PaginationState,
    ): Promise<void> => {
        setState((prev: CrudState) => ({ ...prev, loading: true, error: null }));
        try {
            let data = await AtletasService.listarAtletas(
                filters?.nome || undefined,
                filters?.nivelExperiencia || undefined,
                filters?.temLesao,
            );

            if (pagination) {
                const start = pagination.page * pagination.pageSize;
                const end = start + pagination.pageSize;
                data = data.slice(start, end);
            }

            setState((prev: CrudState) => ({ ...prev, atletas: data, loading: false }));
        } catch (error) {
            setState((prev: CrudState) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao carregar atletas',
                loading: false
            }));
        }
    }, []);

    const createAtleta = useCallback(async (data: CreateAtleta): Promise<void> => {
        setState((prev: CrudState) => ({ ...prev, loading: true, error: null }));
        try {
            await AtletasService.cadastraAtleta(data);
            await loadAtletas();
        } catch (error) {
            setState((prev: CrudState) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao criar atleta',
                loading: false
            }));
        }
    }, [loadAtletas]);

    const updateAtleta = useCallback(async (id: string, data: UpdateAtleta): Promise<void> => {
        setState((prev: CrudState) => ({ ...prev, loading: true, error: null }));
        try {
            const currentAtleta = await AtletasService.buscarAtletaPorId(id);
            const updatedData = {
                ...currentAtleta,
                ...data,
                nome: data.nome || currentAtleta.nome || '',
                objetivo: data.objetivo || currentAtleta.objetivo || '',
                nivelExperiencia: data.nivelExperiencia || currentAtleta.nivelExperiencia || 'INICIANTE',
                diasDisponiveis: data.diasDisponiveis || currentAtleta.diasDisponiveis || []
            };
            
            await AtletasService.atualizarAtleta(id, updatedData);
            await loadAtletas();
        } catch (error) {
            setState((prev: CrudState) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao atualizar atleta',
                loading: false
            }));
        }
    }, [loadAtletas]);

    const deleteAtleta = useCallback(async (id: string): Promise<void> => {
        setState((prev: CrudState) => ({ ...prev, loading: true, error: null }));
        try {
            await AtletasService.deletarAtleta(id);
            await loadAtletas();
        } catch (error) {
            setState((prev: CrudState) => ({
                ...prev,
                error: error instanceof Error ? error.message : 'Erro ao deletar atleta',
                loading: false
            }));
        }
    }, [loadAtletas]);

    const selectAtleta = useCallback((atleta: Atleta | null) => {
        setState((prev: CrudState) => ({ ...prev, selectedAtleta: atleta }));
    }, []);

    const clearError = useCallback(() => {
        setState((prev: CrudState) => ({ ...prev, error: null }));
    }, []);

    useEffect(() => {
        loadAtletas();
    }, [loadAtletas]);

    return {
        ...state,
        loadAtletas,
        createAtleta,
        updateAtleta,
        deleteAtleta,
        selectAtleta,
        clearError
    };
};

export const useAtletaFilters = (atletas: Atleta[]) => {
    const [filters, setFilters] = useState<AtletaFilters>({
        nome: '',
        nivelExperiencia: undefined,
        objetivo: undefined,
        temLesao: undefined,    
    });

    const [pagination, setPagination] = useState<PaginationState>({
        page: 0,
        pageSize: 10,
        total: 0,
    });

    const [sort, setSort] = useState<SortState>({
        sortBy: 'nome',
        order: 'asc',
    });

    const filteredAtletas = useCallback((): Atleta[] => {
        let result = [...atletas];

        if(filters.nome) {
            const nomeLower = filters.nome.toLowerCase();
            result = result.filter(atleta => atleta.nome && atleta.nome.toLowerCase().includes(nomeLower));
        }
        if(filters.nivelExperiencia) {
            result = result.filter(atleta => atleta.nivelExperiencia === filters.nivelExperiencia);
        }
        if(filters.objetivo) {
            const objetivoLower = filters.objetivo.toLowerCase();
            result = result.filter(atleta => atleta.objetivo && atleta.objetivo.toLowerCase().includes(objetivoLower));
        }
        if(filters.temLesao !== undefined) {
            result = result.filter(atleta => atleta.temLesao === filters.temLesao);
        }

        // Aplicar ordenação
        if (sort.sortBy) {
            result.sort((a, b) => {
                const aValue = a[sort.sortBy];
                const bValue = b[sort.sortBy];

                if (aValue === undefined || bValue === undefined) return 0;

                if (aValue < bValue) return sort.order === 'asc' ? -1 : 1;
                if (aValue > bValue) return sort.order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;  
    }, [atletas, filters, sort]);

    const paginatedAtletas = useCallback((): Atleta[] => {
        const filtered = filteredAtletas();
        const start = pagination.page * pagination.pageSize;
        const end = start + pagination.pageSize;

        setPagination(prev => ({ ...prev, total: filtered.length }));

        return filtered.slice(start, end);
    }, [filteredAtletas, pagination.page, pagination.pageSize]);

    const updateFilters = useCallback((newFilters: Partial<AtletaFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
        setPagination(prev => ({ ...prev, page: 0 })); // Resetar para a primeira página ao mudar filtros
    }, [])  ;

    const updatePagination = useCallback((newPagination: Partial<PaginationState>) => {
        setPagination(prev => ({ ...prev, ...newPagination }));
    }, []);

    // Atualizar ordenação
    const updateSort = useCallback((newSort: Partial<SortState>) => {
        setSort(prev => ({ ...prev, ...newSort }));
    }, []);
    
    return {
        filters,
        pagination,
        sort,
        filteredAtletas: filteredAtletas(),
        paginatedAtletas: paginatedAtletas(),
        updateFilters,
        updatePagination,
        updateSort
    };
}
