
import random
from collections import defaultdict

ACTIONS = ("NS", "EW")


def bucket(value):
    return min(3, max(0, int(value) // 3))


class TrafficAgent:
    def __init__(self):
        self.q = defaultdict(lambda: [0.0, 0.0])
        self.history = []
        self.trained = False

    def state(self, north, south, east, west, current):
        return (
            bucket(north + south),
            bucket(east + west),
            0 if current == "NS" else 1
        )

    def _best(self, state):
        values = self.q[state]
        return 0 if values[0] >= values[1] else 1

    def train(
        self,
        episodes=500,
        alpha=0.15,
        gamma=0.92,
        epsilon=0.08
    ):
        rng = random.Random(42)
        self.q.clear()
        self.history = []

        for episode in range(1, episodes + 1):
            ns = rng.randint(0, 10)
            ew = rng.randint(0, 10)
            phase = rng.choice(ACTIONS)
            total_reward = 0

            for _ in range(35):
                state = (
                    bucket(ns),
                    bucket(ew),
                    0 if phase == "NS" else 1
                )

                if rng.random() < epsilon:
                    action = rng.randrange(2)
                else:
                    action = self._best(state)

                chosen = ACTIONS[action]

                next_ns = max(
                    0,
                    ns - (3 if chosen == "NS" else 0)
                ) + rng.randint(0, 3)

                next_ew = max(
                    0,
                    ew - (3 if chosen == "EW" else 0)
                ) + rng.randint(0, 3)

                reward = -(next_ns + next_ew)

                if chosen != phase:
                    reward -= 2

                next_state = (
                    bucket(next_ns),
                    bucket(next_ew),
                    action
                )

                old_q = self.q[state][action]
                future_q = max(self.q[next_state])

                self.q[state][action] = old_q + alpha * (
                    reward + gamma * future_q - old_q
                )

                ns = next_ns
                ew = next_ew
                phase = chosen
                total_reward += reward

            if episode % max(1, episodes // 25) == 0 or episode == 1:
                self.history.append({
                    "episode": episode,
                    "reward": round(total_reward / 35, 2)
                })

        self.trained = True
        return self.history

    def decide(self, queues, current, emergency=None):
        if emergency in ("N", "S", "E", "W"):
            phase = "NS" if emergency in ("N", "S") else "EW"
            return {
                "phase": phase,
                "duration": 8,
                "reason": "Emergency priority",
                "source": "emergency-rule"
            }

        ns = queues["N"] + queues["S"]
        ew = queues["E"] + queues["W"]

        state = self.state(
            queues["N"],
            queues["S"],
            queues["E"],
            queues["W"],
            current
        )

        learned_phase = (
            ACTIONS[self._best(state)]
            if self.trained
            else ("NS" if ns >= ew else "EW")
        )

        if ew >= ns + 3:
            phase = "EW"
        elif ns >= ew + 3:
            phase = "NS"
        else:
            phase = learned_phase

        duration = max(
            5,
            min(18, (ns if phase == "NS" else ew) * 2 + 5)
        )

        override = phase != learned_phase

        return {
            "phase": phase,
            "duration": duration,
            "reason": (
                "Queue priority override"
                if override
                else "Learned policy"
            ),
            "source": (
                "queue-override"
                if override
                else "q-learning"
            )
        }
