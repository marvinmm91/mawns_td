"use strict";

PW.Messages = {
  add(text, type = "info") {
    const state = PW.state;
    state.messages.push({ text, type, life: 4.2, maxLife: 4.2 });
    if (state.messages.length > 5) state.messages.shift();
    this.render();
  },
  update(dt) {
    const state = PW.state;
    state.messages.forEach((msg) => { msg.life -= dt; });
    state.messages = state.messages.filter((msg) => msg.life > 0);
    this.render();
  },
  render() {
    const stack = PW.state.dom.toastStack;
    if (!stack) return;
    stack.innerHTML = "";
    PW.state.messages.forEach((msg) => {
      const div = document.createElement("div");
      div.className = `toast ${msg.type}`;
      div.textContent = msg.text;
      stack.appendChild(div);
    });
  }
};

