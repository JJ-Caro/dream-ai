// Community Sharing Store
// Anonymous dream sharing and community features

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { logError } from '@/lib/errorLogger';
import type { SharedDream, Dream, JungianArchetype } from '@/types/dream';

interface Comment {
  id: string;
  user_id: string;
  shared_dream_id: string;
  content: string;
  anonymous: boolean;
  display_name?: string;
  created_at: string;
}

interface CommunityState {
  sharedDreams: SharedDream[];
  mySharedDreams: SharedDream[];
  isLoading: boolean;
  
  fetchCommunityDreams: (options?: { 
    limit?: number; 
    offset?: number;
    archetype?: JungianArchetype;
    theme?: string;
  }) => Promise<void>;
  fetchMySharedDreams: () => Promise<void>;
  shareDream: (dream: Dream, anonymous: boolean, displayName?: string) => Promise<SharedDream>;
  unshareDream: (sharedDreamId: string) => Promise<void>;
  likeDream: (sharedDreamId: string) => Promise<void>;
  unlikeDream: (sharedDreamId: string) => Promise<void>;
  addComment: (sharedDreamId: string, content: string, anonymous: boolean, displayName?: string) => Promise<void>;
  fetchComments: (sharedDreamId: string) => Promise<Comment[]>;
}

export const useCommunityStore = create<CommunityState>((set, get) => ({
  sharedDreams: [],
  mySharedDreams: [],
  isLoading: false,
  
  fetchCommunityDreams: async (options = {}) => {
    if (!supabase) return;
    set({ isLoading: true });
    
    try {
      let query = supabase
        .from('shared_dreams')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(options.limit || 20);
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
      }
      
      if (options.archetype) {
        query = query.contains('archetypes', [options.archetype]);
      }
      
      if (options.theme) {
        query = query.contains('themes', [options.theme]);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (options.offset && options.offset > 0) {
        // Append for pagination
        set(state => ({
          sharedDreams: [...state.sharedDreams, ...(data as SharedDream[])],
        }));
      } else {
        set({ sharedDreams: data as SharedDream[] });
      }
    } catch (error) {
      logError('fetchCommunityDreams', error);
    } finally {
      set({ isLoading: false });
    }
  },
  
  fetchMySharedDreams: async () => {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('shared_dreams')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      set({ mySharedDreams: data as SharedDream[] });
    } catch (error) {
      logError('fetchMySharedDreams', error);
    }
  },
  
  shareDream: async (dream, anonymous, displayName) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');
    
    // Extract archetypes from dream
    const archetypes: JungianArchetype[] = [];
    if (dream.quick_archetype?.likely_archetype) {
      archetypes.push(dream.quick_archetype.likely_archetype);
    }
    if (dream.deep_analysis?.primary_archetype?.type) {
      archetypes.push(dream.deep_analysis.primary_archetype.type);
    }
    if (dream.deep_analysis?.secondary_archetypes) {
      archetypes.push(...dream.deep_analysis.secondary_archetypes.map(a => a.type));
    }
    
    const sharedDream: Omit<SharedDream, 'id' | 'created_at' | 'likes' | 'comments_count'> = {
      user_id: user.id,
      dream_id: dream.id,
      anonymous,
      display_name: anonymous ? undefined : displayName,
      narrative: dream.cleaned_narrative,
      themes: dream.themes,
      archetypes: [...new Set(archetypes)],
    };
    
    const { data, error } = await supabase
      .from('shared_dreams')
      .insert(sharedDream)
      .select()
      .single();
    
    if (error) throw error;
    
    const newShared = data as SharedDream;
    set(state => ({
      sharedDreams: [newShared, ...state.sharedDreams],
      mySharedDreams: [newShared, ...state.mySharedDreams],
    }));
    
    return newShared;
  },
  
  unshareDream: async (sharedDreamId) => {
    if (!supabase) return;
    
    const { error } = await supabase
      .from('shared_dreams')
      .delete()
      .eq('id', sharedDreamId);
    
    if (error) throw error;
    
    set(state => ({
      sharedDreams: state.sharedDreams.filter(d => d.id !== sharedDreamId),
      mySharedDreams: state.mySharedDreams.filter(d => d.id !== sharedDreamId),
    }));
  },
  
  likeDream: async (sharedDreamId) => {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    // Insert like record
    const { error: likeError } = await supabase
      .from('dream_likes')
      .insert({ user_id: user.id, shared_dream_id: sharedDreamId });
    
    if (likeError) {
      // Might already be liked
      logError('likeDream', likeError);
      return;
    }
    
    // Increment likes count
    const { error: updateError } = await supabase.rpc('increment_likes', {
      dream_id: sharedDreamId,
    });
    
    if (updateError) {
      logError('likeDream increment', updateError);
      return;
    }
    
    set(state => ({
      sharedDreams: state.sharedDreams.map(d =>
        d.id === sharedDreamId ? { ...d, likes: d.likes + 1 } : d
      ),
    }));
  },
  
  unlikeDream: async (sharedDreamId) => {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error: deleteError } = await supabase
      .from('dream_likes')
      .delete()
      .eq('user_id', user.id)
      .eq('shared_dream_id', sharedDreamId);
    
    if (deleteError) {
      logError('unlikeDream', deleteError);
      return;
    }
    
    const { error: updateError } = await supabase.rpc('decrement_likes', {
      dream_id: sharedDreamId,
    });
    
    if (updateError) {
      logError('unlikeDream decrement', updateError);
      return;
    }
    
    set(state => ({
      sharedDreams: state.sharedDreams.map(d =>
        d.id === sharedDreamId ? { ...d, likes: Math.max(0, d.likes - 1) } : d
      ),
    }));
  },
  
  addComment: async (sharedDreamId, content, anonymous, displayName) => {
    if (!supabase) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { error: commentError } = await supabase
      .from('dream_comments')
      .insert({
        user_id: user.id,
        shared_dream_id: sharedDreamId,
        content,
        anonymous,
        display_name: anonymous ? undefined : displayName,
      });
    
    if (commentError) {
      logError('addComment', commentError);
      return;
    }
    
    // Increment comments count
    const { error: updateError } = await supabase.rpc('increment_comments', {
      dream_id: sharedDreamId,
    });
    
    if (updateError) {
      logError('addComment increment', updateError);
    }
    
    set(state => ({
      sharedDreams: state.sharedDreams.map(d =>
        d.id === sharedDreamId ? { ...d, comments_count: d.comments_count + 1 } : d
      ),
    }));
  },
  
  fetchComments: async (sharedDreamId) => {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('dream_comments')
      .select('*')
      .eq('shared_dream_id', sharedDreamId)
      .order('created_at', { ascending: true });
    
    if (error) {
      logError('fetchComments', error);
      return [];
    }
    
    return data as Comment[];
  },
}));
