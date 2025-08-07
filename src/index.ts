// uuidライブラリをインポート
import { v4 as uuidv4 } from 'uuid';

// Workerの環境変数（KVのバインディング）を型定義
export interface Env {
  SURVEY_ANSWERS: KVNamespace;
}

// アンケートのデータ構造を定義
// host と rate を必須項目としています
interface SurveyData {
  host: string;
  username?: string;
  email?: string;
  rate: number;
  comment?: string;
  timestamp: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'POST') {
      try {
        const data: SurveyData = await request.json();

        // 必須項目である host と rate のバリデーション
        if (!data.host || typeof data.rate !== 'number' || data.rate < 1 || data.rate > 5) {
            return new Response(JSON.stringify({ error: 'host と rate は必須項目です。' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json', ...corsHeaders },
            });
        }
        
        // timestampをサーバー側で生成
        data.timestamp = Date.now();

        // ユニークなID（UUID）をキーとして生成
        const key = uuidv4();
        
        // データをJSON文字列に変換してKVに保存
        await env.SURVEY_ANSWERS.put(key, JSON.stringify(data));
        
        return new Response(JSON.stringify({ message: 'アンケート回答を保存しました。', key: key }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: 'リクエストの形式が正しくありません。' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ error: '許可されていないHTTPメソッドです。' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
