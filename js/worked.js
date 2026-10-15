import {esc,markdown} from './render.js';
// Keys are lesson section IDs, so calculations stay beside the relevant notes.
// String.raw preserves TeX backslashes for the native MathML renderer.
export const examples={
 'neural-networks-1':{
  prompt:String.raw`Use a two-hidden-neuron network, with ReLU at both hidden neurons and the output, and no biases. Use inputs $x_1=2,x_2=1$ and weights $(w_1,w_2,w_3,w_4,w_5,w_6)=(1,-1,0.5,1,3,-1)$. Calculate both hidden activations and the output. These weights define the worked example.`,
  solution:String.raw`Apply the activation after each weighted sum.

| Neuron | Weighted sum | ReLU output |
|---|---|---|
| h₁ | 1 × 2 + (−1) × 1 = 1 | 1 |
| h₂ | 0.5 × 2 + 1 × 1 = 2 | 2 |
| Output | 3 × 1 + (−1) × 2 = 1 | 1 |

The output uses the hidden activations, not the raw inputs. If the hidden preactivations are 0 and −1, both hidden activations and the final output are zero. Forward ReLU(0) = 0 is well defined; its derivative at zero needs a convention if you subsequently differentiate.

This nonzero illustrative path also supports a calculation of a hidden-weight gradient.`,
  question:'Keep these six illustrative weights and x₂ = 1, but change x₁ to 3. What is the final output after all three ReLU activations?',answer:3.5,tolerance:.0001,
  hint:'The hidden activations are ReLU(3 − 1) and ReLU(0.5 × 3 + 1). Use those two results in ReLU(3h₁ − h₂).'
 },
 'unsupervised-2':{
  prompt:String.raw`Use one-dimensional points A=0, B=0.2, C=0.4, D=1.4, E=2.4, F=2.6, G=2.8 and H=5. With radius ε=1 and MinPts=4, count distances at most ε, **including the point itself**. Identify the core points, core-connected clusters, border points and noise.`,
  solution:String.raw`The exact neighborhoods are:

| Point | Neighbors | Count |
|---|---|---|
| A | A, B, C | 3 |
| B | A, B, C | 3 |
| C | A, B, C, D | 4 |
| D | C, D, E | 3 |
| E | D, E, F, G | 4 |
| F | E, F, G | 3 |
| G | E, F, G | 3 |
| H | H | 1 |

Only C and E meet MinPts. Their distance is 2, exceeding ε, so they form **two core-connected components**. A and B are borders of C's component; F and G are borders of E's. H has no adjacent core and is noise.

D lies within ε of both C and E but has only three neighbors. It is a **shared border**, assigned to whichever component expands first. It does not merge the two components: expansion continues through core points, not through arbitrary border chains. The experiment preserves component IDs while changing this assignment.

Lowering MinPts to 3 at the same radius makes A through G core. The chain now joins them into one cluster; H stays noise. That is a parameter change, unlike merely changing traversal order.`,
  question:'Keep the same eight points, but set ε = 0.25 and MinPts = 3. How many points are noise? Count each point itself and do not expand through border points.',answer:2,tolerance:0,
  hint:'B and F each see a three-point neighborhood. A/C and E/G attach to those cores. Check whether D or H is within 0.25 of any core.'
 },
 'transportation-3':{
  prompt:String.raw`Two scenario groups have natural rare-group probability p=0.01 and test probability q=0.2. Conditional event probabilities are 0.5 in the rare group and 0.001 in the ordinary group. Calculate the raw test rate and the corrected expected rate. Then distinguish those expectations from a finite observed estimate.`,
  solution:String.raw`Weights correct group selection; they do not change the conditional event probabilities.

| Group | Natural probability | Test probability | Weight |
|---|---|---|---|
| Rare | 0.01 | 0.2 | 0.01/0.2 = 0.05 |
| Ordinary | 0.99 | 0.8 | 0.99/0.8 = 1.2375 |

The raw test event rate is $0.2(0.5)+0.8(0.001)=0.1008$, or **10.08%**. The corrected expectation is $0.2(0.5)(0.05)+0.8(0.001)(1.2375)=0.00599$, or **0.599%**. It equals the natural rate $0.01(0.5)+0.99(0.001)$.

For a finite batch of **100 independent trials**, suppose you actually observe 3 rare-group events and 1 ordinary-group event. Average the weighted event indicators over **all trials**:

$\hat p_A=(3(0.05)+1(1.2375))/100=0.013875$.

This realized estimate is 1.3875%, not the expected 0.599%. Unbiasedness is an expectation across repeated sampling; it does not force each batch to equal the target. Dividing by the four events instead of 100 trials would estimate a different quantity.

Under the fixed two-group model, the lab computes the estimator's variance analytically. It does not draw this batch or infer a vehicle's actual risk. Both relevant groups must remain sampled, and the assumed natural distribution and within-group behavior must be appropriate.`,
  question:'Use p = 0.02 and q = 0.5, keeping conditional risks 0.5 and 0.001. What is the corrected expected event probability? Enter a fraction between 0 and 1, not a percentage.',answer:.01098,tolerance:.000001,
  hint:'The two weights are 0.02/0.5 and 0.98/0.5. Multiply each weight by its test-group probability and conditional event risk, then sum.'
 },

 'segmentation-1':{
  prompt:String.raw`A binary segmentation task has 16 pixels. Comparing a prediction with its target gives TP = 4, FP = 2, FN = 1 and TN = 9. Calculate foreground IoU, background IoU and pixel accuracy.

To reproduce these counts in the mask editor, select **Five pixels**, clear the prediction, then turn on these (row, column) cells: (1,2), (1,3), (2,2), (2,3), (3,3), (4,2). Rows and columns start at 1.`,
  solution:String.raw`The foreground intersection is TP = 4. Its union includes every true or predicted foreground pixel: $4+2+1=7$.

| Score | Calculation | Result |
|---|---|---|
| Foreground IoU | 4 / (4 + 2 + 1) | 4/7 ≈ 0.5714 |
| Background IoU | 9 / (9 + 2 + 1) | 3/4 = 0.75 |
| Mean class IoU | (4/7 + 3/4) / 2 | 37/56 ≈ 0.6607 |
| Pixel accuracy | (4 + 9) / 16 | 13/16 = 0.8125 |

For the background class, TN becomes the correctly predicted intersection; the same two kinds of mistakes remain in its union. Mean IoU weights the two classes equally, whereas accuracy weights pixels equally. These scores answer different questions.

If foreground is absent from **both** masks, its intersection and union are zero. This guide reports its IoU as undefined and excludes that class from the mean. This is an explicit demo convention; dataset protocols may differ. If even one false-positive foreground pixel exists, its union is nonzero and its IoU is 0.`,
  question:'For a new 16-pixel mask, TP = 3, FP = 1, FN = 2 and TN = 10. What is the foreground IoU? Enter a decimal.',answer:.5,tolerance:.0001,
  hint:'Use TP / (TP + FP + FN). Correct background pixels TN do not enter the foreground union.'
 },
 'sequence-generative-5':{
  prompt:String.raw`A one-dimensional VAE encoder gives $q(z|x)$ as a Gaussian with mean $\mu=1$ and standard deviation $\sigma=0.5$. The prior is a standard normal. For an illustrative noise draw $\varepsilon=-2$, calculate $z=\mu+\sigma\varepsilon$ and the positive KL penalty.

$$KL(q‖p)=\frac{1}{2}(\mu^2+\sigma^2-1-\ln\sigma^2)$$`,
  solution:String.raw`Use standard deviation when scaling noise, but variance inside the KL expression.

| Quantity | Calculation | Value |
|---|---|---|
| Variance | 0.5² | 0.25 |
| Sampled z | 1 + 0.5 × (−2) | 0 |
| KL penalty | (1 + 0.25 − 1 − ln 0.25) / 2 | ≈ 0.818147 |

A sampled value of zero does not make the whole posterior equal to the prior. The KL compares distributions and does not depend on this particular noise draw. It is zero at $\mu=0,\sigma=1$.

Training minimizes a reconstruction negative log-likelihood **plus** this positive regularizer, averaged appropriately across data. We cannot calculate the full objective without a decoder likelihood and its reconstruction result. During unconditional generation, sample from the prior and decode; no input image needs to be encoded.`,
  question:'Now μ = −0.5 and σ = 2 (standard deviation, not variance). Calculate ½(μ² + σ² − 1 − ln σ²), using the natural logarithm.',answer:(.25+4-1-Math.log(4))/2,tolerance:.0001,
  hint:'Square both μ and σ first. The log term is ln 4. Add 0.25 + 4 − 1 − ln 4, then divide by 2.'
 },
 'sequence-generative-6':{
  prompt:String.raw`Use cumulative signal-retention factor $a=0.64$, clean value $x_0=2$ and noise realization $\varepsilon=-1$. Form $x_t=\sqrt{a}x_0+\sqrt{1-a}\varepsilon$. A predictor estimates noise as $\hat{\varepsilon}=-0.5$. Estimate the clean value by subtracting the predicted noise contribution and dividing by $\sqrt{a}$.`,
  solution:String.raw`Here $\sqrt{a}=0.8$ and $\sqrt{1-a}=0.6$.

| Operation | Calculation | Result |
|---|---|---|
| Forward noisy value | 0.8 × 2 + 0.6 × (−1) | 1 |
| Subtract predicted noise | 1 − 0.6 × (−0.5) | 1.3 |
| Estimate clean value | 1.3 / 0.8 | 1.625 |
| Noise squared error | (−0.5 − (−1))² | 0.25 |
| Clean-value squared error | (1.625 − 2)² | 0.140625 |

The clean-value error squared equals the noise error squared times $(1-a)/a$: $0.25(0.36/0.64)=0.140625$. The same noise-estimation error is amplified more when a is small. Exact noise prediction would recover 2 for this constructed example.

This is a one-coordinate conditional calculation, not a learned model or complete reverse step. The estimated clean value is not $x_{t-1}$. A sampler needs a chosen reverse transition, time schedule and sometimes additional noise. Real generation does not know the clean target or the true noise realization.`,
  question:'Use a = 0.36, x₀ = −1 and ε = 0.5. First calculate xₜ. Then use predicted noise ε̂ = 0.25. What clean value does (xₜ − √(1 − a) ε̂) / √a estimate?',answer:-2/3,tolerance:.0001,
  hint:'√a = 0.6 and √(1 − a) = 0.8. The noisy value is −0.2. Subtract 0.8 × 0.25, then divide by 0.6.'
 },

 'classification-detection-7':{
  prompt:String.raw`Compare two linear SVM candidates on the points below. Use $f(x)=w^Tx+b$ and $J=\frac{1}{2}‖w‖^2+C\sum_i\max(0,1-y_i f(x_i))$. Start with $w=(1,0)$, $b=0$, $C=1$.

| Point | Label y |
|---|---|
| (−2, 0) | −1 |
| (−1, 1) | −1 |
| (0.5, −1) | +1 |
| (2, 1) | +1 |`,
  solution:String.raw`For the first candidate, the norm is 1, so signed geometric distance equals the functional margin $y f$.

| Point | f | y f | Signed distance | Hinge max(0, 1 − y f) |
|---|---|---|---|---|
| (−2, 0) | −2 | 2 | 2 | 0 |
| (−1, 1) | −1 | 1 | 1 | 0 |
| (0.5, −1) | 0.5 | 0.5 | 0.5 | 0.5 |
| (2, 1) | 2 | 2 | 2 | 0 |

Every sign prediction is correct, yet one point is inside the unit-margin band. The hinge sum is 0.5 and the objective is $0.5+1(0.5)=1$.

Now double both parameters: $w=(2,0)$, $b=0$. Scores double, but distances divide by the doubled norm, so the boundary and geometric distances stay unchanged. Functional margins are now $[4,2,1,4]$; all hinge losses are zero. The objective is $\frac{1}{2}(2^2)+1(0)=2$.

At **C = 1**, the first candidate costs less. At **C = 4**, its objective becomes $0.5+4(0.5)=2.5$, while the second remains 2. This is a comparison of two candidates, not proof that either globally minimizes the objective. The canonical band narrows when weight length grows; the actual points do not move.`,
  question:'For a different candidate, ‖w‖ = 2, the three functional margins y f are [0.5, 1.5, 0.25], and C = 0.4. Calculate ½‖w‖² + C times the sum of hinge losses.',
  answer:2.5,tolerance:.001,
  hint:'Apply max(0, 1 − y f) separately to each point. Sum the losses, multiply by C, then add half the squared weight length. Do not average the losses.'
 },
 'unsupervised-5':{
  prompt:String.raw`One observation has two other observations at distances 1 and 2. Use Gaussian weights $e^{-d^2/(2\sigma^2)}$ with $\sigma=1$. Calculate the conditional neighbor probabilities. Do not include a self-similarity term.`,
  solution:String.raw`Square the distances, divide by $2\sigma^2=2$, negate, then exponentiate.

| Neighbor | Distance | Exponent | Unnormalized weight |
|---|---|---|---|
| A | 1 | −1/2 | 0.606531 |
| B | 2 | −4/2 | 0.135335 |

The weight sum is about 0.741866. Divide each weight by this sum:

- A: $0.606531/0.741866\approx0.817574$.
- B: $0.135335/0.741866\approx0.182426$.

The probabilities sum to 1. A gets more mass because it is closer. These are **one point's conditional similarities**, not class probabilities or two-dimensional embedding coordinates. Full t-SNE also selects bandwidths, symmetrizes affinities, defines low-dimensional t affinities, and optimizes map positions. Rounding the displayed weights slightly changes the last decimal.`,
  question:'Now use distances 1 and 3 with σ = 2. Normalize the two Gaussian weights exp(−d²/(2σ²)). What probability is assigned to the nearer observation? Enter a decimal between 0 and 1.',
  answer:1/(1+Math.exp(-1)),tolerance:.0001,
  hint:'The denominator in each exponent is 2 × 2² = 8. The two weights are exp(−1/8) and exp(−9/8). Divide the first by their sum.'
 },
 'transformers-5':{
  prompt:String.raw`Use two tokens with input rows $X_1=[1,0]$ and $X_2=[0,1]$. There are two heads with scalar query, key and value widths ($d_k=d_v=1$), no mask and no bias. The fixed projection columns are:

| Head | W^Q | W^K | W^V |
|---|---|---|---|
| 1 | [1; 1] | [0; ln 3] | [2; 6] |
| 2 | [1; 1] | [ln 3; 0] | [4; 0] |

Semicolons separate rows. Calculate both heads, concatenate their outputs, then apply the output projection with rows [1, 1] and [1, −1].`,
  solution:String.raw`Because X is the 2×2 identity matrix, multiplying by a projection returns its column. Both query rows are 1 in both heads. Scaling by $\sqrt{d_k}=1$ leaves scores unchanged.

| Per query row | Head 1 | Head 2 |
|---|---|---|
| Scores across keys | [0, ln 3] | [ln 3, 0] |
| Exponentials | [1, 3] | [3, 1] |
| Softmax weights | [1/4, 3/4] | [3/4, 1/4] |
| Weighted value | (1/4)×2 + (3/4)×6 = 5 | (3/4)×4 + (1/4)×0 = 3 |

Each head produces two scalar rows. Concatenating their **columns** gives a 2×2 matrix whose rows are both [5, 3]; do not average the head values to 4.

Multiply each row by the chosen output projection:

- First output coordinate: $5(1)+3(1)=8$.
- Second output coordinate: $5(1)+3(-1)=2$.

The final two rows are both **[8, 2]**. They coincide because we deliberately chose equal queries, not because multi-head attention always returns identical rows. This is a manually specified arithmetic example, not a trained model; the output is before residual addition and normalization.`,
  question:'Keep the example unchanged except for head 2’s value projection: replace [4; 0] with [8; 0]. What is the first coordinate after concatenation and the same output projection?',
  answer:11,tolerance:.001,
  hint:'Changing V leaves query–key scores and weights unchanged. Recalculate head 2’s weighted scalar, concatenate it with head 1’s 5, then multiply by the first output-projection column [1; 1].'
 },

 'supervised-3':{
  prompt:String.raw`For the points $(1,2),(2,4),(3,5)$, evaluate the line $\hat y=1.5x+0.5$. Find each residual and the mean squared error. Predict whether positive and negative errors can cancel in MSE.`,
  solution:String.raw`The residual is prediction minus observation: $r_i=\hat y_i-y_i$.

| Input x | Observed y | Prediction | Residual | Squared residual |
|---|---|---|---|---|
| 1 | 2 | 1.5 × 1 + 0.5 = 2 | 0 | 0 |
| 2 | 4 | 1.5 × 2 + 0.5 = 3.5 | −0.5 | 0.25 |
| 3 | 5 | 1.5 × 3 + 0.5 = 5 | 0 | 0 |

$$\mathrm{MSE}=\frac{0+0.25+0}{3}=\frac{1}{12}\approx0.08333$$

Divide by **three observations**, not by the number of nonzero errors. Squaring makes every contribution nonnegative, so errors cannot cancel. MSE has squared target units; it is not the average distance to the line.

This evaluates one candidate line. Fitting means changing its parameters to reduce the objective. A low error on these three training points alone says nothing about unseen data.`,
  question:'For x = [1, 2, 3], observed y = [2, 5, 5], and prediction ŷ = 2x − 1, calculate MSE. Enter a decimal.',
  answer:5/3,tolerance:.001,
  hint:'Compute all three predictions first. Square each prediction-minus-observation residual, add the squares, then divide by 3.'
 },
 'unsupervised-1':{
  prompt:String.raw`Run one k-means iteration on the one-dimensional points $1,2,8,9$, starting from centroids $1$ and $8$. First assign points, then update centroids. Compare the squared-distance objective before and after the update.`,
  solution:String.raw`Choose the centroid with the smaller **squared distance**. Squaring preserves the nearest-centroid ordering.

| Point | Distance² to 1 | Distance² to 8 | Assignment |
|---|---|---|---|
| 1 | 0 | 49 | Cluster A |
| 2 | 1 | 36 | Cluster A |
| 8 | 49 | 0 | Cluster B |
| 9 | 64 | 1 | Cluster B |

Before moving the centers, $J=0+1+0+1=2$.

1. Cluster A mean: $(1+2)/2=1.5$.
2. Cluster B mean: $(8+9)/2=8.5$.
3. Recompute the objective using those new centers: $J=0.25+0.25+0.25+0.25=1$.

The next assignment leaves both clusters unchanged, and the next mean update leaves both centers unchanged. This run has converged.

The mean minimizes squared distance for a **fixed membership**. Alternating assignments and means cannot increase this objective in exact arithmetic, but different initializations can reach different local solutions. Cluster letters are identifiers, not known class labels.`,
  question:'Use points [0, 2, 9, 11] and initial centroids 0 and 9. Assign each point, update both centroids to their cluster means, then calculate the total squared-distance objective J using the new centroids.',
  answer:4,tolerance:.001,
  hint:'The two nearest-center groups each contain two points. Find their means, then sum all four squared distances to the updated centers; do not average the objective.'
 },
 'neural-networks-2':{
  prompt:String.raw`A single linear neuron predicts $\hat y=wx+b$. Use $x=2$, target $y=5$, $w=1$, and $b=0$. For $L=(\hat y-y)^2$, calculate the gradient with respect to $w$ and take one step with learning rate $\eta=0.1$. Keep $b$ fixed.`,
  solution:String.raw`**Forward pass:** $\hat y=1\times2+0=2$. The residual is $2-5=-3$, so $L=(-3)^2=9$.

**Backward pass:** separate the two links in the chain.

$$\frac{\partial L}{\partial\hat y}=2(\hat y-y)=-6$$
$$\frac{\partial\hat y}{\partial w}=x=2$$
$$\frac{\partial L}{\partial w}=\frac{\partial L}{\partial\hat y}\frac{\partial\hat y}{\partial w}=(-6)\times2=-12$$

**Parameter update:** $w_{new}=1-0.1(-12)=2.2$. The negative gradient makes the subtraction increase the weight.

**Check the result:** the new prediction is $2.2\times2=4.4$ and the loss is $(4.4-5)^2=0.36$, down from $9$.

Backpropagation computes the derivative; the optimizer uses it to change the parameter. Here the loss has no factor of $1/2$, so its derivative includes the factor of $2$. Only one weight is updated in this example.`,
  question:'For ŷ = wx + b, use x = 3, y = 8, w = 1, b = 0 and L = (ŷ − y)². Keep b fixed and take one gradient-descent step with learning rate 0.02. What is the new w?',
  answer:1.6,tolerance:.001,
  hint:'The gradient is 2(wx + b − y)x. Include the input factor x, then subtract learning rate × gradient from the original weight.'
 },
 'transformers-4':{
  prompt:String.raw`Use one query $Q=(1,0)$, two keys $K_1=(0,1)$ and $K_2=(\sqrt{2}\ln3,0)$, and values $V_1=(2,0)$ and $V_2=(0,4)$. Compute scaled dot-product attention without a mask. The key coordinates are chosen to make the softmax arithmetic simple.`,
  solution:String.raw`Each query and key has two coordinates, so $d_k=2$. There is one score per key and one two-coordinate output vector.

| Key | Query–key dot product | Divide by √2 | Exponential |
|---|---|---|---|
| 1 | 1 × 0 + 0 × 1 = 0 | 0 | 1 |
| 2 | 1 × (√2 ln 3) + 0 × 0 = √2 ln 3 | ln 3 | 3 |

Softmax divides each exponential by their sum: $a_1=1/(1+3)=0.25$ and $a_2=3/(1+3)=0.75$. The weights sum to $1$; the raw scores need not.

Weight the **values**, coordinate by coordinate:

$$O=0.25(2,0)+0.75(0,4)=(0.5,3)$$

If the second key is a future token forbidden by a causal mask, remove it before softmax. The remaining weights become $(1,0)$ and the output becomes $(2,0)$. Setting a forbidden score to zero would be wrong: its exponential would still be positive.

These are fixed teaching vectors. A model normally learns projections that produce queries, keys, and values.`,
  question:'For a different attention row, the scores after scaling are [0, ln 4] and scalar values are [2, 7]. With no mask, what is the weighted scalar output?',
  answer:6,tolerance:.001,
  hint:'Exponentiate the scores to get 1 and 4, normalize by their sum, then use those weights on the two values. The scores are already scaled.'
 },
 'classification-detection-1':{
  prompt:String.raw`Apply the Sobel X kernel to this image patch. Use the CNN cross-correlation convention: multiply entries in the same position, without flipping the kernel. Predict whether a brighter right side gives a positive or negative response.

| Row | Patch values | Kernel values |
|---|---|---|
| Top | 1, 2, 4 | −1, 0, 1 |
| Middle | 0, 3, 5 | −2, 0, 2 |
| Bottom | 2, 1, 6 | −1, 0, 1 |`,
  solution:String.raw`Every output entry is the sum of nine products. Keep the signs of the kernel coefficients.

| Row | Three products | Row sum |
|---|---|---|
| Top | 1 × (−1) + 2 × 0 + 4 × 1 | 3 |
| Middle | 0 × (−2) + 3 × 0 + 5 × 2 | 10 |
| Bottom | 2 × (−1) + 1 × 0 + 6 × 1 | 4 |

The output is $3+10+4=17$. Positive right-hand coefficients and negative left-hand coefficients make this response positive for a brighter right side. The middle column contributes zero.

This is a **raw filter response**, not an intensity constrained to 0–255 or a probability. A negative value is allowed. A mean filter would instead use nine coefficients of $1/9$; do not divide the Sobel result by nine.

For a $5\times5$ input and this $3\times3$ kernel, stride 1 with no padding gives $5-3+1=3$ output positions on each axis. Sliding the same kernel fills the $3\times3$ output map.`,
  question:'Use the same Sobel X kernel without flipping it. The new patch rows are [0, 1, 3], [1, 2, 4], and [2, 3, 5]. What is the sum of the nine products?',
  answer:12,tolerance:.001,
  hint:'For each row, subtract the left value from the right value. Double the middle row’s difference, then add the three contributions; do not average them.'
 },
 'classification-detection-3':{
  prompt:String.raw`A binary classifier produces $TP=12$, $FP=3$, $FN=8$, and $TN=77$. Calculate precision, recall, F1, and accuracy. Explain why accuracy alone can conceal missed positive cases.`,
  solution:String.raw`The counts total $100$ examples. There are $12+3=15$ predicted positives and $12+8=20$ actual positives.

| Metric | Calculation | Result |
|---|---|---|
| Precision | 12 / (12 + 3) | 0.8 = 80% |
| Recall | 12 / (12 + 8) | 0.6 = 60% |
| F1 | (2 × 12) / (2 × 12 + 3 + 8) | 24/35 ≈ 0.6857 |
| Accuracy | (12 + 77) / 100 | 0.89 = 89% |

Precision asks how many **positive predictions** were correct. Recall asks how many **actual positives** were found. F1 is their harmonic mean: $2\times0.8\times0.6/(0.8+0.6)=24/35$, not their arithmetic average of $0.7$.

Accuracy is 89%, yet the classifier misses $8/20=40%$ of actual positives. If only TN increases, accuracy rises while precision, recall, and F1 stay unchanged. Changing these counts describes a different population of outcomes; it is not itself a simulation of changing a decision threshold.

If a metric's denominator is zero, report it as undefined under this guide's convention.`,
  question:'A different confusion matrix has TP = 9, FP = 3, FN = 6, TN = 82. Calculate F1. Enter a decimal between 0 and 1, not a percentage.',
  answer:2/3,tolerance:.001,
  hint:'Use F1 = 2TP / (2TP + FP + FN). True negatives are not in this formula; do not average precision and recall arithmetically.'
 }
};
export function workedHTML(id){const x=examples[id];if(!x)return '';return `<section class="worked-example" data-example="${id}"><h3>Worked example</h3><div class="prose">${markdown(x.prompt)}</div><details data-help><summary>Show calculation</summary><div class="prose">${markdown(x.solution)}</div></details><form class="numeric-check"><h3>Try a different case</h3><p>${esc(x.question)}</p><label>Your answer <input type="number" step="any" required aria-label="Calculation answer"></label><button class="button small">Check</button><p class="muted">Absolute tolerance: ${x.tolerance??0.001}.</p><p data-feedback role="status"></p></form></section>`}
export function bindWorked(root){const submit=e=>{const form=e.target.closest('.numeric-check');if(!form)return;e.preventDefault();const box=form.closest('[data-example]'),x=examples[box.dataset.example],input=form.querySelector('input'),value=Number(input.value),ok=input.value.trim()!==''&&Number.isFinite(value)&&Math.abs(value-x.answer)<=(x.tolerance??.001),help=box.dataset.assisted==='true';form.querySelector('[data-feedback]').textContent=ok?`Correct.${help?' Worked solution viewed in this attempt.':''}`:`Check again. ${x.hint}`};const toggle=e=>{if(e.target.matches?.('[data-help]')&&e.target.open)e.target.closest('[data-example]').dataset.assisted='true'};root.addEventListener('submit',submit);root.addEventListener('toggle',toggle,true);return()=>{root.removeEventListener('submit',submit);root.removeEventListener('toggle',toggle,true)}}
