// Simple test function
Deno.serve((req)=>{
  return new Response(JSON.stringify({
    status: "ok",
    message: "test-health is working",
    timestamp: new Date().toISOString()
  }), {
    headers: {
      "Content-Type": "application/json"
    }
  });
});
