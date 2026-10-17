The Rust Message struct in atoma's src/domain/session.rs has fields:
- role: String
- content: Option<Value> (skip_serializing_if none)
- tool_calls: Option<Vec<ToolCall>> (skip if none)
- tool_call_id: Option<String> (skip if none)
- name: Option<String> (skip if none)
- atoma_metadata: Option<Value> (skip if none)
- provider_items: Option<Vec<Value>> (default, skip if none)
- reasoning_content: Option<String> (default, skip if none)

NO finish_reason field exists. Session struct: { messages, metadata: Option<Value>, extra (flattened HashMap) }.
