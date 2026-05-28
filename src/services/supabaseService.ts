import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import env from '../utils/env';
import 'react-native-url-polyfill/auto';

class SupabaseService {
  private supabase: any;
  private isEnabled: boolean;

  constructor() {
    this.isEnabled = env.SUPABASE_ENABLED === 'true' && 
                     !!env.SUPABASE_URL && 
                     !!env.SUPABASE_ANON_KEY;

    if (this.isEnabled) {
      this.supabase = createClient(
        env.SUPABASE_URL,
        env.SUPABASE_ANON_KEY,
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false,
          },
        }
      );
    }
  }

  async reportThreat(threatData: any) {
    if (!this.isEnabled) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('threat_reports')
        .insert([threatData]);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error reporting threat to Supabase:', error);
      return null;
    }
  }

  async getThreats(limit: number = 50) {
    if (!this.isEnabled) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('threat_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching threats from Supabase:', error);
      return [];
    }
  }

  async checkURL(url: string) {
    if (!this.isEnabled) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('malicious_urls')
        .select('*')
        .eq('url', url)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error checking URL in Supabase:', error);
      return null;
    }
  }

  async checkPhoneNumber(number: string) {
    if (!this.isEnabled) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('scammer_numbers')
        .select('*')
        .eq('phone_number', number)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error checking phone number in Supabase:', error);
      return null;
    }
  }

  async saveScanHistory(scanData: any) {
    if (!this.isEnabled) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('scan_history')
        .insert([scanData]);
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving scan history to Supabase:', error);
      return null;
    }
  }

  async getSecurityTips() {
    if (!this.isEnabled) return [];
    
    try {
      const { data, error } = await this.supabase
        .from('security_tips')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching security tips:', error);
      return [];
    }
  }

  async syncSettings(userId: string, settings: any) {
    if (!this.isEnabled) return null;
    
    try {
      const { data, error } = await this.supabase
        .from('app_settings')
        .upsert({ user_id: userId, ...settings });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error syncing settings:', error);
      return null;
    }
  }
}

export const supabaseService = new SupabaseService();
