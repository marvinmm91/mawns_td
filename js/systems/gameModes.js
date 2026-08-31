"use strict";

PW.GameModes = {
  profile(id = PW.state && PW.state.gameMode) {
    const modes = PW.CONFIG.gameModes;
    return modes.profiles.find((profile) => profile.id === id) || modes.profiles.find((profile) => profile.id === modes.default);
  },
  normalize(id) {
    return this.profile(id).id;
  }
};
