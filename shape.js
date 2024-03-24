/* Intersection structure:
 * t:        ray parameter (float), i.e. distance of intersection point to ray's origin
 * position: position (THREE.Vector3) of intersection point
 * normal:   normal (THREE.Vector3) of intersection point
 * material: material of the intersection object
 */
class Intersection {
	constructor() {
		this.t = 0;
		this.position = new THREE.Vector3();
		this.normal = new THREE.Vector3();
		this.material = null;
	}
	set(isect) {
		this.t = isect.t;
		this.position = isect.position;
		this.normal = isect.normal;
		this.material = isect.material;
	}
}

/* Plane shape
 * P0: a point (THREE.Vector3) that the plane passes through
 * n:  plane's normal (THREE.Vector3)
 */
class Plane {
	constructor(P0, n, material) {
		this.P0 = P0.clone();
		this.n = n.clone();
		this.n.normalize();
		this.material = material;
	}
	// Given ray and range [tmin,tmax], return intersection point.
	// Return null if no intersection.
	intersect(ray, tmin, tmax) {
		let temp = this.P0.clone();
		temp.sub(ray.o); // (P0-O)
		let denom = ray.d.dot(this.n); // d.n
		if (denom == 0) {
			return null;
		}
		let t = temp.dot(this.n) / denom; // (P0-O).n / d.n
		if (t < tmin || t > tmax) return null; // check range
		let isect = new Intersection(); // create intersection structure
		isect.t = t;
		isect.position = ray.pointAt(t);
		isect.normal = this.n;
		isect.material = this.material;
		return isect;
	}
}

/* Sphere shape
 * C: center of sphere (type THREE.Vector3)
 * r: radius
 */
class Sphere {
	constructor(C, r, material) {
		this.C = C.clone();
		this.r = r;
		this.r2 = r * r;
		this.material = material;
	}
	intersect(ray, tmin, tmax) {
		// ===YOUR CODE STARTS HERE===
		//Calculating A, B, C
		let aCap = 1; //A
		let o_C = ray.o.clone().sub(this.C.clone());
		let bCap = ray.d
			.clone()
			.multiplyScalar(2)
			.dot(ray.o.clone().sub(this.C.clone()));
		let cCap =
			Math.pow(ray.o.clone().sub(this.C.clone()).length(), 2) - this.r2; //Length O-C - r^2
		//Calculate delta and denominator
		let delta = bCap ** 2 - 4 * aCap * cCap; // B^2 - 4AC
		let denom = 2 * aCap; // 2A
		if (delta < 0) return null; //if delta < 0
		else {
			delta = Math.sqrt(delta);
			let t1 = (-bCap - delta) / denom;
			let t2 = (-bCap + delta) / denom;
			let t = tmin;
			if (t1 < 0) t = t2;
			else t = t1;
			if (t < 0) return null;
			if (t < tmin) return null;
			if (t > tmax) return null;
			let isect = new Intersection();
			isect.t = t;
			isect.position = ray.pointAt(t);
			isect.normal = isect.position.clone().sub(this.C).normalize();
			isect.material = this.material;
			return isect;
		}
		// ---YOUR CODE ENDS HERE---
	}
}

class Triangle {
	/* P0, P1, P2: three vertices (type THREE.Vector3) that define the triangle
	 * n0, n1, n2: normal (type THREE.Vector3) of each vertex */
	constructor(P0, P1, P2, material, n0, n1, n2) {
		this.P0 = P0.clone();
		this.P1 = P1.clone();
		this.P2 = P2.clone();
		this.material = material;
		if (n0) this.n0 = n0.clone();
		if (n1) this.n1 = n1.clone();
		if (n2) this.n2 = n2.clone();

		// below you may pre-compute any variables that are needed for intersect function
		// such as the triangle normal etc.
		// ===YOUR CODE STARTS HERE===
		this.triNormal = P2.clone()
			.sub(P0.clone())
			.cross(P2.clone().sub(P1.clone()))
			.normalize();
		// ---YOUR CODE ENDS HERE---
	}
	//function calculating determinant
	findDeterminant3x3(mat) {
		const [[a, b, c], [d, e, f], [g, h, i]] = mat;
		if (
			mat.length < 3 ||
			mat[0].length < 3 ||
			mat[1].length < 3 ||
			mat[2].length < 3
		)
			return 0;
		return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
	}
	intersect(ray, tmin, tmax) {
		// ===YOUR CODE STARTS HERE===
		let rayD = ray.d.clone(); //d
		let p2_p0 = this.P2.clone().sub(this.P0.clone()); //P2 - P0
		let p2_p1 = this.P2.clone().sub(this.P1.clone()); //P2 - P1
		let p2_O = this.P2.clone().sub(ray.o.clone()); //P2 - O
		let matD = [
			[rayD.x, p2_p0.x, p2_p1.x],
			[rayD.y, p2_p0.y, p2_p1.y],
			[rayD.z, p2_p0.z, p2_p1.z],
		]; //matrix d
		let matT = [
			[p2_O.x, p2_p0.x, p2_p1.x],
			[p2_O.y, p2_p0.y, p2_p1.y],
			[p2_O.z, p2_p0.z, p2_p1.z],
		]; //matrix computing t
		let matAlpha = [
			[rayD.x, p2_O.x, p2_p1.x],
			[rayD.y, p2_O.y, p2_p1.y],
			[rayD.z, p2_O.z, p2_p1.z],
		]; //matrix computing alpha
		let matBeta = [
			[rayD.x, p2_p0.x, p2_O.x],
			[rayD.y, p2_p0.y, p2_O.y],
			[rayD.z, p2_p0.z, p2_O.z],
		]; // matrix computing beta
		let determinantD = this.findDeterminant3x3(matD);
		//check if D > 0 -> if not, no intersect
		if (determinantD == 0) return null;
		let determinantT = this.findDeterminant3x3(matT);
		let determinantA = this.findDeterminant3x3(matAlpha);
		let determinantB = this.findDeterminant3x3(matBeta);
		let t = determinantT / determinantD;
		let alpha = determinantA / determinantD;
		let beta = determinantB / determinantD;
		//check constraint -> if not, not in triangle
		if (t < 0 || alpha < 0 || beta < 0) return null;
		if (alpha + beta > 1) return null;
		if (t < tmin || t > tmax) return null;
		let isect = new Intersection();
		isect.t = t;
		//smooth normal
		if (this.n0 != null && this.n1 != null && this.n2 != null)
			isect.normal = this.n0
				.clone()
				.multiplyScalar(alpha)
				.add(
					this.n1
						.clone()
						.multiplyScalar(beta)
						.add(this.n2.clone().multiplyScalar(1 - alpha - beta))
				);
		//flat normal
		else isect.normal = this.triNormal;
		isect.position = ray.pointAt(t);
		isect.material = this.material;
		return isect;
		// ---YOUR CODE ENDS HERE---
	}
}

function shapeLoadOBJ(objstring, material, smoothnormal) {
	loadOBJFromString(
		objstring,
		function (mesh) {
			// callback function for non-blocking load
			if (smoothnormal) mesh.computeVertexNormals();
			for (let i = 0; i < mesh.faces.length; i++) {
				let p0 = mesh.vertices[mesh.faces[i].a];
				let p1 = mesh.vertices[mesh.faces[i].b];
				let p2 = mesh.vertices[mesh.faces[i].c];
				if (smoothnormal) {
					let n0 = mesh.faces[i].vertexNormals[0];
					let n1 = mesh.faces[i].vertexNormals[1];
					let n2 = mesh.faces[i].vertexNormals[2];
					shapes.push(new Triangle(p0, p1, p2, material, n0, n1, n2));
				} else {
					shapes.push(new Triangle(p0, p1, p2, material));
				}
			}
		},
		function () {},
		function () {}
	);
}

/* ========================================
 * You can define additional Shape classes,
 * as long as each implements intersect function.
 * ======================================== */
