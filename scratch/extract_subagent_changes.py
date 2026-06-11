import json

log_path = "/Users/mac/.gemini/antigravity/brain/48d6959e-9a7b-4ba8-9a7d-fcb6d825eb7a/.system_generated/logs/transcript.jsonl"

with open(log_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('type') == 'PLANNER_RESPONSE' or data.get('source') == 'MODEL':
            tool_calls = data.get('tool_calls', [])
            for tc in tool_calls:
                name = tc.get('name')
                if name in ('replace_file_content', 'write_to_file', 'multi_replace_file_content'):
                    args = tc.get('args', {})
                    # Clean up json strings inside args if they are double-encoded
                    print(f"=== TOOL CALL: {name} ===")
                    print(f"TargetFile: {args.get('TargetFile') or args.get('TargetContent')}")
                    print(f"Instruction: {args.get('Instruction')}")
                    if 'StartLine' in args:
                        print(f"Lines: {args.get('StartLine')} - {args.get('EndLine')}")
                    print("ReplacementContent:\n", args.get('ReplacementContent'))
                    print("="*40)
