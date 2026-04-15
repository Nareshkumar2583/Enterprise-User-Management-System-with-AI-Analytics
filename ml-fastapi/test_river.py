
from river import anomaly

stream_model = anomaly.HalfSpaceTrees(
    n_trees=25,
    height=8,
    window_size=250,
    seed=42
)

for i in range(10):
    features = {'duration': i * 1.5, 'action_len': 10 + i}
    score = stream_model.score_one(features)
    stream_model.learn_one(features)
    print(f"Iter {i}: Score {score}")
