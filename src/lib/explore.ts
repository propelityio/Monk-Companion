import { answer } from "./chat.ts";
let pass=0, fail=0; const ok=(c:boolean,m:string)=>{c?pass++:fail++; console.log((c?"PASS ":"FAIL ")+m);};
let answerText="";
globalThis.fetch = (async (url: string, init: RequestInit) => {
  if (String(url).includes("anthropic")) { const b = JSON.parse(String(init.body));
    const text = b.max_tokens === 200 ? '{"intent":"share","en":"anger","es":"ira","pt":"raiva"}' : b.max_tokens === 150 ? "I hear you. What happened?" : answerText;
    return new Response(JSON.stringify({ content: [{ type: "text", text }] }), { status: 200 }); }
  return new Response(JSON.stringify([{ id:"a#0", source_id:"a", title:"Tips 34", video_url:null, language:"en", content:"Anger is a mental state.", rank:1 }]), { status: 200 });
}) as typeof fetch;
process.env.SUPABASE_URL="x"; process.env.SUPABASE_SERVICE_ROLE_KEY="k"; process.env.ANTHROPIC_API_KEY="k";
const ask=(q:string)=>answer([{role:"assistant",content:"Good evening. How was your day?"},{role:"user",content:q}]);

answerText="MODE: EXPLORE\nThat sounds like it really got under your skin. What did your brother say, and what went through your mind when he said it?";
let r=await ask("I got really angry at my brother today.");
ok(r.content.startsWith("That sounds") && !r.content.includes("MODE") && r.citations.length===0, "explore: reflection + questions, no sources, no MODE line");

answerText="MODE: EXPLORE\nIn Buddhism anger is a mental state that grows by habit [1]. What happened?";
r=await ask("I got really angry at my brother today.");
ok(!r.content.includes("grows by habit"), "explore reply sneaking in cited teaching is rejected");

answerText="MODE: EXPLORE\n"+"word ".repeat(150);
r=await ask("I got really angry.");
ok(r.content==="I hear you. What happened?", "over-long explore reply rejected, falls back to a listening reply");

answerText="MODE: TEACH\nThank you for telling me.\n\nIn Buddhism, anger is a mental state [1]. Does it make sense?";
r=await ask("What does Buddhism say about anger?");
ok(r.content.startsWith("Thank you") && r.citations.length===1 && !r.content.includes("MODE"), "teach: grounded reply with source, MODE line removed");

answerText="Thank you.\n\nAnger is a mental state [1]. What do you think?";
r=await ask("What does Buddhism say about anger?");
ok(r.citations.length===1, "reply without a MODE line still works");
console.log(`${pass} passed, ${fail} failed`);
