import { serve } from "bun";

let sharedText = "";

const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <title>Share</title>
    <style>
        textarea {
            width: 98%;
            height: 95vh;
            margin: 1%;
            resize: none;
            font-family: monospace;
            border: none;
            outline: none;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        textarea:focus {
            outline: none;
        }
    </style>
</head>
<body>
    <textarea id="content" autofocus oninput="updateContent(this.value)">${sharedText}</textarea>
    <script async>
        function updateContent(value) {
            fetch('/', {
                method: 'POST',
                body: value
            });
        }
        
        // Initial load
        (async () => {
            const response = await fetch('/');
            const text = await response.text();
            document.getElementById('content').value = text;
        })();
        
        setInterval(async () => {
            const response = await fetch('/');
            const text = await response.text();
            const textarea = document.getElementById('content');
            if (textarea.value !== text) {
                textarea.value = text;
            }
        }, 1000);
    </script>
</body>
</html>
`;

const port = 3456;
serve({
    port,
    async fetch(req) {
        if (req.method === "POST") {
            sharedText = await req.text();
            return new Response("OK");
        }
        
        if (req.method === "GET") {
            if (req.headers.get("accept")?.includes("text/html")) {
                return new Response(htmlTemplate, {
                    headers: { "Content-Type": "text/html" },
                });
            }
            return new Response(sharedText);
        }
        
        return new Response("Method not allowed", { status: 405 });
    },
});

// Get local IP address
const localIP = await $`ipconfig getifaddr en0`.text()

console.log(`Share running at:`);
console.log(`  Local:   http://localhost:${port}`);
console.log(`  Network: http://${localIP.trim()}:${port}`);
