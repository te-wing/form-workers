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

    // ...（省略）
    if (request.method === 'POST') {
      try {
        // 【ここを修正します】
        const requestBodyText = await request.text();
        console.log('受け取ったリクエストボディ:', requestBodyText);

        const data: SurveyData = JSON.parse(requestBodyText);

        // 必須項目である host と rate のバリデーション
        if (!data.host || typeof data.rate !== 'number' || data.rate < 1 || data.rate > 5) {
          return new Response(JSON.stringify({ error: 'ちゃんと評価してや〜！' }), {
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
    
        return new Response(JSON.stringify({ message: 'たぶんアンケート回答を保存できました．', key: key }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });

      } catch (e) {
        // エラーメッセージを分かりやすく出力
        console.error('JSONパースエラー:', e);
        return new Response(JSON.stringify({ error: 'リクエストの形式が間違うてる気がするかもしれません．' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'こんなHTTPメソッドは許可してへんぞ！' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  },
};
